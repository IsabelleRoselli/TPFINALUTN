const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Database = require("better-sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const multer = require("multer");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos subidos (imágenes) desde /uploads/...
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Base de datos SQLite (archivo dev.db dentro de backend/)
const db = new Database("dev.db");

// 1) Creamos tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    sku TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    category TEXT,
    image_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

function nowIso() {
  return new Date().toISOString();
}

// =======================
// UPLOADS (Multer)
// =======================
// Asegurate de crear la carpeta: backend/uploads
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

// 2) Creamos un admin si no existe (para que puedas entrar sin complicarte)
function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@admin.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return;

  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, 'admin', ?)"
  ).run(email, hash, nowIso());

  console.log("Admin creado:");
  console.log("email:", email);
  console.log("password:", password);
}

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
// RUTAS
// =======================

// Probar que está vivo
app.get("/health", (_req, res) => res.json({ ok: true }));

// ======== PUBLIC (CATÁLOGO) ========
// Listar productos públicos (solo activos) + búsqueda + paginación + filtro por categoría
app.get("/products", (req, res) => {
  try {
    const search = (req.query.search || "").toString().trim();
    const category = (req.query.category || "").toString().trim();

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || "50", 10)));
    const offset = (page - 1) * pageSize;

    let where = "status = 'active'";
    const params = [];

    if (search) {
      where += " AND (name LIKE ? OR sku LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      where += " AND category = ?";
      params.push(category);
    }

    // Nota: devolvemos * igual que admin, así es fácil de usar en el front.
    const items = db
      .prepare(`SELECT * FROM products WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset);

    const totalRow = db
      .prepare(`SELECT COUNT(*) as count FROM products WHERE ${where}`)
      .get(...params);

    res.json({
      items,
      pagination: {
        page,
        pageSize,
        total: totalRow.count,
        totalPages: Math.ceil(totalRow.count / pageSize),
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Error cargando productos" });
  }
});

// Detalle público (solo activos)
app.get("/products/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);

    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    if (product.status !== "active") return res.status(404).json({ error: "Producto no disponible" });

    res.json(product);
  } catch (e) {
    res.status(500).json({ error: "Error cargando producto" });
  }
});

// LOGIN (devuelve token)
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Faltan datos" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// SUBIR IMAGEN (devuelve una URL pública para guardar en el producto)
app.post("/admin/upload", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Falta archivo" });

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ url });
});

// LISTAR productos (con búsqueda + paginación)
app.get("/admin/products", requireAdmin, (req, res) => {
  const search = (req.query.search || "").toString().trim();
  const status = req.query.status ? req.query.status.toString() : null;

  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || "10", 10)));
  const offset = (page - 1) * pageSize;

  let where = "1=1";
  const params = [];

  if (search) {
    where += " AND (name LIKE ? OR sku LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    where += " AND status = ?";
    params.push(status);
  }

  const items = db
    .prepare(`SELECT * FROM products WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);

  const totalRow = db
    .prepare(`SELECT COUNT(*) as count FROM products WHERE ${where}`)
    .get(...params);

  res.json({
    items,
    pagination: {
      page,
      pageSize,
      total: totalRow.count,
      totalPages: Math.ceil(totalRow.count / pageSize),
    },
  });
});

// CREAR producto
app.post("/admin/products", requireAdmin, (req, res) => {
  const { name, description, priceCents, stock, sku, status, category, imageUrl } = req.body || {};

  if (!name || !sku || priceCents == null) {
    return res.status(400).json({ error: "name, sku, priceCents son obligatorios" });
  }

  try {
    const t = nowIso();
    const info = db
      .prepare(
        `INSERT INTO products (name, description, price_cents, stock, sku, status, category, image_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        description || null,
        parseInt(priceCents, 10),
        stock != null ? parseInt(stock, 10) : 0,
        sku,
        status || "active",
        category || null,
        imageUrl || null,
        t,
        t
      );

    const created = db.prepare("SELECT * FROM products WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (e) {
    if (String(e.message || "").includes("UNIQUE")) {
      return res.status(409).json({ error: "SKU ya existe" });
    }
    res.status(500).json({ error: "Error servidor" });
  }
});

// EDITAR producto
app.put("/admin/products/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!product) return res.status(404).json({ error: "No existe" });

  const patch = req.body || {};
  const updated = {
    name: patch.name ?? product.name,
    description: patch.description ?? product.description,
    price_cents: patch.priceCents != null ? parseInt(patch.priceCents, 10) : product.price_cents,
    stock: patch.stock != null ? parseInt(patch.stock, 10) : product.stock,
    sku: patch.sku ?? product.sku,
    status: patch.status ?? product.status,
    category: patch.category ?? product.category,
    image_url: patch.imageUrl ?? product.image_url,
    updated_at: nowIso(),
  };

  try {
    db.prepare(
      `UPDATE products
       SET name=?, description=?, price_cents=?, stock=?, sku=?, status=?, category=?, image_url=?, updated_at=?
       WHERE id=?`
    ).run(
      updated.name,
      updated.description,
      updated.price_cents,
      updated.stock,
      updated.sku,
      updated.status,
      updated.category,
      updated.image_url,
      updated.updated_at,
      id
    );

    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    res.json(row);
  } catch (e) {
    if (String(e.message || "").includes("UNIQUE")) {
      return res.status(409).json({ error: "SKU ya existe" });
    }
    res.status(500).json({ error: "Error servidor" });
  }
});

// “BORRAR” producto (suave): lo archiva
app.delete("/admin/products/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!product) return res.status(404).json({ error: "No existe" });

  db.prepare("UPDATE products SET status='archived', updated_at=? WHERE id=?").run(nowIso(), id);
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  res.json(row);
});

// =======================
// INICIO DEL SERVER
// =======================
const port = parseInt(process.env.PORT || "3001", 10);

app.listen(port, () => {
  ensureAdmin();
  console.log(`Backend listo: http://localhost:${port}`);
  console.log(`Probar: http://localhost:${port}/health`);
});