const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const connectDB = require("./src/config/db");
const User = require("./src/models/User");
const Product = require("./src/models/Product");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
console.log("ENV CHECK:", {
  cwd: process.cwd(),
  __dirname,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD_SET: !!process.env.ADMIN_PASSWORD,
  MONGO_URI_SET: !!process.env.MONGO_URI,
});

const app = express();
app.use(cors());
app.use(express.json());
// =======================
// FRONTEND estático (sitio + admin)
// =======================
const rootDir = path.join(__dirname, ".."); // raíz del proyecto (afuera de /backend)
app.use("/styles.css", express.static(path.join(rootDir, "styles.css")));
app.use("/catalogo.js", express.static(path.join(rootDir, "catalogo.js")));

app.use("/images", express.static(path.join(rootDir, "images")));
app.use("/js", express.static(path.join(rootDir, "js")));
app.use("/pages", express.static(path.join(rootDir, "pages")));

// Home del sitio
app.get("/", (_req, res) => {
  return res.redirect("/index.html");
});

// Servir index.html (si está en la raíz del proyecto)
app.get("/index.html", (_req, res) => {
  return res.sendFile(path.join(rootDir, "index.html"));
});

// Rutas lindas del admin
app.get("/admin", (_req, res) => res.redirect("/pages/admin/login.html"));
app.get("/admin/login", (_req, res) => res.redirect("/pages/admin/login.html"));
app.get("/admin/panel", (_req, res) => res.redirect("/pages/admin/products.html"));

// Servir archivos subidos (imágenes) desde /uploads/...
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================
// HELPERS (validación / formato)
// =======================
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseNonNegativeInt(value, fieldName) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) {
    return { ok: false, error: `${fieldName} debe ser un número` };
  }
  if (n < 0) {
    return { ok: false, error: `${fieldName} no puede ser negativo` };
  }
  return { ok: true, value: n };
}

function normalizeStatus(value) {
  if (value == null) return { ok: true, value: undefined };
  const v = String(value).trim();
  if (v !== "active" && v !== "archived") {
    return { ok: false, error: "status debe ser 'active' o 'archived'" };
  }
  return { ok: true, value: v };
}

function mapProductResponse(p) {
  return {
    id: p._id.toString(),
    name: p.name,
    description: p.description,
    price_cents: p.priceCents,
    stock: p.stock,
    sku: p.sku,
    status: p.status,
    category: p.category || null,
    image_url: p.imageUrl || null,
    created_at: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updated_at: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  };
}

// =======================
// UPLOADS (Multer)
// =======================
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// =======================
// AUTH HELPERS
// =======================
function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET en .env");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Falta Bearer token" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Solo admin" });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o vencido" });
  }
}

// =======================
// SEED ADMIN
// =======================
async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@admin.com").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "admin123").trim();

  const existing = await User.findOne({ email });
  if (existing) return;

  await User.create({ email, password, role: "admin" });

  console.log("Admin creado:");
  console.log("email:", email);
  console.log("password:", password);
}

// =======================
// RUTAS
// =======================

// Probar que está vivo
app.get("/health", (_req, res) => res.json({ ok: true }));

// LOGIN (devuelve token)
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Faltan datos" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await user.comparePassword(String(password));
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = signToken({ userId: user._id.toString(), role: user.role, email: user.email });
    res.json({ token, user: { id: user._id.toString(), email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ error: "Error servidor" });
  }
});

// SUBIR IMAGEN (devuelve una URL pública para guardar en el producto)
app.post("/admin/upload", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Falta archivo" });

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ url });
});

// ======== ADMIN PRODUCTS ========

// LISTAR productos (con búsqueda + paginación)
app.get("/admin/products", requireAdmin, async (req, res) => {
  try {
    const search = (req.query.search || "").toString().trim();
    const statusRaw = req.query.status ? req.query.status.toString().trim() : "";

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || "10", 10)));

    const filter = {};
    if (statusRaw) {
      const st = normalizeStatus(statusRaw);
      if (!st.ok) return res.status(400).json({ error: st.error });
      filter.status = st.value;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.json({
      items: items.map((p) =>
        mapProductResponse({
          ...p,
          _id: p._id,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          priceCents: p.priceCents,
          imageUrl: p.imageUrl,
        })
      ),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch {
    res.status(500).json({ error: "Error servidor" });
  }
});

// CREAR producto
app.post("/admin/products", requireAdmin, async (req, res) => {
  const { name, description, priceCents, stock, sku, status, category, imageUrl } = req.body || {};

  console.log("POST /admin/products recibió:", { name, description, priceCents, stock, sku, status, category, imageUrl });

  if (!name || !sku || priceCents == null) {
    return res.status(400).json({ error: "name, sku, priceCents son obligatorios" });
  }

  const priceParsed = parseNonNegativeInt(priceCents, "priceCents");
  if (!priceParsed.ok) return res.status(400).json({ error: priceParsed.error });

  const stockParsed = stock == null ? { ok: true, value: 0 } : parseNonNegativeInt(stock, "stock");
  if (!stockParsed.ok) return res.status(400).json({ error: stockParsed.error });

  const st = normalizeStatus(status || "active");
  if (!st.ok) return res.status(400).json({ error: st.error });

  try {
    const created = await Product.create({
      name: String(name),
      description: description != null ? String(description) : "",
      priceCents: priceParsed.value,
      stock: stockParsed.value,
      sku: String(sku),
      status: st.value,
      category: category != null ? String(category) : "",
      imageUrl: imageUrl != null ? String(imageUrl) : "",
    });

    res.status(201).json(mapProductResponse(created));
  } catch (e) {
    console.error("ERROR creando producto:", e);
    if (e && e.code === 11000) return res.status(409).json({ error: "SKU ya existe" });
    if (e && e.name === "ValidationError") {
      const messages = Object.values(e.errors).map(err => err.message).join("; ");
      return res.status(400).json({ error: `Validación: ${messages}` });
    }
    res.status(500).json({ error: e.message || "Error servidor" });
  }
});

// EDITAR producto
app.put("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "No existe" });

    const patch = req.body || {};

    if (patch.name != null) product.name = String(patch.name);
    if (patch.description != null) product.description = String(patch.description);

    if (patch.priceCents != null) {
      const parsed = parseNonNegativeInt(patch.priceCents, "priceCents");
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });
      product.priceCents = parsed.value;
    }

    if (patch.stock != null) {
      const parsed = parseNonNegativeInt(patch.stock, "stock");
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });
      product.stock = parsed.value;
    }

    if (patch.sku != null) product.sku = String(patch.sku);

    if (patch.status != null) {
      const st = normalizeStatus(patch.status);
      if (!st.ok) return res.status(400).json({ error: st.error });
      product.status = st.value;
    }

    if (patch.category != null) product.category = String(patch.category);
    if (patch.imageUrl != null) product.imageUrl = String(patch.imageUrl);

    await product.save();
    return res.json(mapProductResponse(product));
  } catch (e) {
    console.error("ERROR actualizando producto:", e);
    if (e && e.code === 11000) return res.status(409).json({ error: "SKU ya existe" });
    if (e && e.name === "ValidationError") {
      const messages = Object.values(e.errors).map(err => err.message).join("; ");
      return res.status(400).json({ error: `Validación: ${messages}` });
    }
    return res.status(500).json({ error: e.message || "Error servidor" });
  }
});

// "BORRAR" producto (suave): lo archiva
app.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "No existe" });

    product.status = "archived";
    await product.save();

    return res.json(mapProductResponse(product));
  } catch {
    return res.status(500).json({ error: "Error servidor" });
  }
});

// ======== PUBLIC (CATÁLOGO) ========

// Listar productos públicos (solo activos) + búsqueda + paginación + filtro por categoría
app.get("/products", async (req, res) => {
  try {
    const search = (req.query.search || "").toString().trim();
    const category = (req.query.category || "").toString().trim();

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || "50", 10)));

    const filter = { status: "active" };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.json({
      items: items.map((p) =>
        mapProductResponse({
          ...p,
          _id: p._id,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          priceCents: p.priceCents,
          imageUrl: p.imageUrl,
        })
      ),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch {
    res.status(500).json({ error: "Error cargando productos" });
  }
});

// Detalle público (solo activos)
app.get("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(404).json({ error: "Producto no encontrado" });

    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    if (product.status !== "active") return res.status(404).json({ error: "Producto no disponible" });

    res.json(
      mapProductResponse({
        ...product,
        _id: product._id,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
      })
    );
  } catch {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
});

// =======================
// INICIO DEL SERVER
// =======================
const port = parseInt(process.env.PORT || "3002", 10);

connectDB()
  .then(async () => {
    await ensureAdmin();

    app.listen(port, () => {
      console.log(`Backend listo: http://localhost:${port}`);
      console.log(`Probar: http://localhost:${port}/health`);
    });
  })
  .catch((err) => {
    console.error("Error conectando a MongoDB:", err.message);
    process.exit(1);
  });
