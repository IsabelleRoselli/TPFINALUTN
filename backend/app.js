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

const app = express();
app.use(cors());
app.use(express.json());

// ===== FRONTEND ESTÁTICO =====
const rootDir = path.join(__dirname, "..");
app.use("/styles.css", express.static(path.join(rootDir, "styles.css")));
app.use("/catalogo.js", express.static(path.join(rootDir, "catalogo.js")));
app.use("/images", express.static(path.join(rootDir, "images")));
app.use("/js", express.static(path.join(rootDir, "js")));
app.use("/pages", express.static(path.join(rootDir, "pages")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => res.redirect("/index.html"));
app.get("/index.html", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/admin", (_req, res) => res.redirect("/admin.html"));

// ===== MULTER PARA IMÁGENES =====
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ===== HELPERS =====
function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }
  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") return res.status(403).json({ error: "Solo admin" });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

// ===== SEED ADMIN =====
async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@admin.com").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "admin123").trim();
  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({ email, password, role: "admin" });
    console.log(`✓ Admin creado: ${email}`);
  }
}

// ===== RUTAS =====
app.get("/health", (_req, res) => res.json({ ok: true }));

// LOGIN
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Faltan email y password" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await user.comparePassword(String(password));
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = signToken({ userId: user._id.toString(), role: user.role, email: user.email });
    res.json({ token });
  } catch (e) {
    console.error("Error login:", e.message);
    res.status(500).json({ error: "Error servidor" });
  }
});

// SUBIR IMAGEN
app.post("/admin/upload", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Falta archivo" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ url });
});

// CREAR PRODUCTO
app.post("/admin/products", requireAdmin, async (req, res) => {
  try {
    const { name, description, priceCents, stock, sku, category, subcategory, imageUrl } = req.body;

    if (!name || !sku || priceCents == null) {
      return res.status(400).json({ error: "name, sku, priceCents son obligatorios" });
    }

    const price = Number(priceCents);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: "priceCents debe ser un número positivo" });
    }

    const stockNum = Number(stock || 0);
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ error: "stock debe ser un número positivo" });
    }

    const product = await Product.create({
      name: String(name).trim(),
      description: String(description || "").trim(),
      priceCents: price,
      stock: stockNum,
      sku: String(sku).trim().toUpperCase(),
      category: String(category || "").trim(),
      subcategory: String(subcategory || "").trim(),
      imageUrl: String(imageUrl || "").trim(),
      status: "active",
    });

    res.status(201).json({
      id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      price_cents: product.priceCents,
      stock: product.stock,
      category: product.category,
      subcategory: product.subcategory,
      image_url: product.imageUrl,
      status: product.status,
    });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "SKU ya existe" });
    console.error("Error creando producto:", e.message);
    res.status(400).json({ error: e.message || "Error creando producto" });
  }
});

// LISTAR PRODUCTOS
app.get("/admin/products", requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 50, search = "" } = req.query;
    const skip = (page - 1) * pageSize;

    const filter = search ? { $or: [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }] } : {};

    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter).sort({ _id: -1 }).skip(skip).limit(pageSize).lean();

    res.json({
      items: items.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        sku: p.sku,
        price_cents: p.priceCents,
        stock: p.stock,
        category: p.category,
        subcategory: p.subcategory,
        image_url: p.imageUrl,
        status: p.status,
      })),
      pagination: { page: Number(page), pageSize: Number(pageSize), total },
    });
  } catch (e) {
    console.error("Error listando productos:", e.message);
    res.status(500).json({ error: "Error listando productos" });
  }
});

// OBTENER UN PRODUCTO
app.get("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "No encontrado" });

    res.json({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      sku: product.sku,
      price_cents: product.priceCents,
      stock: product.stock,
      category: product.category,
      subcategory: product.subcategory,
      image_url: product.imageUrl,
      status: product.status,
    });
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo producto" });
  }
});

// EDITAR PRODUCTO
app.put("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const { name, description, priceCents, stock, sku, category, subcategory, imageUrl, status } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "No encontrado" });

    if (name) product.name = String(name).trim();
    if (description !== undefined) product.description = String(description).trim();
    if (sku) product.sku = String(sku).trim().toUpperCase();
    if (priceCents != null) product.priceCents = Number(priceCents);
    if (stock != null) product.stock = Number(stock);
    if (category !== undefined) product.category = String(category || "").trim();
    if (subcategory !== undefined) product.subcategory = String(subcategory || "").trim();
    if (imageUrl !== undefined) product.imageUrl = String(imageUrl || "").trim();
    if (status && ["active", "archived"].includes(status)) product.status = status;

    await product.save();

    res.json({
      id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      price_cents: product.priceCents,
      stock: product.stock,
      category: product.category,
      subcategory: product.subcategory,
      image_url: product.imageUrl,
      status: product.status,
    });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "SKU ya existe" });
    console.error("Error editando producto:", e.message);
    res.status(400).json({ error: e.message });
  }
});

// ARCHIVAR PRODUCTO
app.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "No encontrado" });

    product.status = "archived";
    await product.save();

    res.json({ message: "Producto archivado", status: product.status });
  } catch (e) {
    res.status(500).json({ error: "Error archivando producto" });
  }
});

// BORRAR PRODUCTO
app.delete("/admin/products/:id/permanent", requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Producto eliminado" });
  } catch (e) {
    res.status(500).json({ error: "Error eliminando producto" });
  }
});

// CATÁLOGO PÚBLICO
app.get("/products", async (req, res) => {
  try {
    const { category = "", subcategory = "", search = "", page = 1, pageSize = 50 } = req.query;
    const skip = (page - 1) * pageSize;

    const filter = { status: "active" };
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];

    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter).sort({ _id: -1 }).skip(skip).limit(pageSize).lean();

    res.json({
      items: items.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        price_cents: p.priceCents,
        stock: p.stock,
        category: p.category,
        subcategory: p.subcategory,
        image_url: p.imageUrl,
      })),
      pagination: { page: Number(page), pageSize: Number(pageSize), total },
    });
  } catch (e) {
    res.status(500).json({ error: "Error cargando productos" });
  }
});

// PRODUCTO PÚBLICO
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product || product.status !== "active") return res.status(404).json({ error: "No encontrado" });

    res.json({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price_cents: product.priceCents,
      stock: product.stock,
      category: product.category,
      subcategory: product.subcategory,
      image_url: product.imageUrl,
    });
  } catch (e) {
    res.status(404).json({ error: "No encontrado" });
  }
});

// ===== INICIO =====
const port = parseInt(process.env.PORT || "3001", 10);

connectDB()
  .then(async () => {
    await ensureAdmin();
    app.listen(port, () => {
      console.log(`✓ Backend listo en http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("✗ Error:", err.message);
    process.exit(1);
  });
