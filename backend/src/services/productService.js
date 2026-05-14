const Product = require("../models/Product");
const Category = require("../models/Category");
const categoryService = require("./categoryService");
const mongoose = require("mongoose");

function mapProduct(p) {
  return {
    id: p._id.toString(),
    name: p.name,
    description: p.description,
    price_cents: p.priceCents,
    stock: p.stock,
    sku: p.sku,
    status: p.status,
    // devolvemos ambos: category (obj) y category_name (string) para compatibilidad
    category: p.category ? { id: p.category._id?.toString?.() || p.category.toString?.(), name: p.category.name } : null,
    category_name: p.category?.name || null,
    image_url: p.imageUrl || null,
    created_at: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updated_at: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  };
}

async function resolveCategory({ categoryId, categoryName }) {
  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) throw new Error("categoryId inválido");
    const cat = await Category.findById(categoryId);
    if (!cat) throw new Error("Categoría no existe");
    return cat;
  }
  // compatibilidad: si viene category como string, lo creamos si no existe
  return categoryService.getOrCreateByName(categoryName);
}

async function createProduct(data) {
  console.log("⚡️ createProduct recibió:", data);
  const { name, description, priceCents, stock, sku, status, imageUrl } = data || {};

  if (!name || !sku || priceCents == null) throw new Error("name, sku, priceCents son obligatorios");
console.log("➡️ Resolviendo categoría con:", data.categoryId, data.categoryName, data.category);

  const cat = await resolveCategory({ categoryId: data.categoryId, categoryName: data.categoryName || data.category });
  };

  console.log("✅ Categoría resuelta:", cat);
  const created = await Product.create({
    name: String(name),
    description: description ? String(description) : "",
    priceCents: Number.parseInt(priceCents, 10),
    stock: stock != null ? Number.parseInt(stock, 10) : 0,
    sku: String(sku),
    status: status || "active",
    category: cat._id,
    imageUrl: imageUrl ? String(imageUrl) : "",
  });

  const populated = await Product.findById(created._id).populate("category").lean();
  return mapProduct(populated);


async function updateProduct(id, patch) {
  const product = await Product.findById(id);
  if (!product) return null;

  if (patch.name != null) product.name = String(patch.name);
  if (patch.description != null) product.description = String(patch.description);
  if (patch.priceCents != null) product.priceCents = Number.parseInt(patch.priceCents, 10);
  if (patch.stock != null) product.stock = Number.parseInt(patch.stock, 10);
  if (patch.sku != null) product.sku = String(patch.sku);
  if (patch.status != null) product.status = String(patch.status);
  if (patch.imageUrl != null) product.imageUrl = String(patch.imageUrl);

  // Soporta patch.categoryId o patch.category (string)
  if (patch.categoryId || patch.categoryName || patch.category) {
    const cat = await resolveCategory({
      categoryId: patch.categoryId,
      categoryName: patch.categoryName || patch.category,
    });
    product.category = cat._id;
  }

  await product.save();
  const populated = await Product.findById(product._id).populate("category").lean();
  return mapProduct(populated);
}

async function archiveProduct(id) {
  const updated = await Product.findByIdAndUpdate(id, { status: "archived" }, { new: true });
  if (!updated) return null;
  const populated = await Product.findById(updated._id).populate("category").lean();
  return mapProduct(populated);
}

async function deleteProductHard(id) {
  return Product.findByIdAndDelete(id);
}

async function listAdmin({ search = "", status = "", page = 1, pageSize = 10 }) {
  const filter = {};
  if (status) filter.status = status;

  if (search) {
    filter.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];
  }

  const total = await Product.countDocuments(filter);
  const items = await Product.find(filter)
    .populate("category")
    .sort({ _id: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return {
    items: items.map(mapProduct),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

async function listPublic({ search = "", category = "", page = 1, pageSize = 50 }) {
  const filter = { status: "active" };

  // compatibilidad: si category viene como nombre (front viejo), filtramos por category.name usando populate no se puede directo.
  // Solución simple: si viene category (nombre), buscamos categoría y filtramos por _id.
  if (category) {
    const cat = await Category.findOne({ name: String(category).trim() }).lean();
    filter.category = cat ? cat._id : "__no_match__";
  }

  if (search) {
    filter.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];
  }

  const total = await Product.countDocuments(filter);
  const items = await Product.find(filter)
    .populate("category")
    .sort({ _id: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return {
    items: items.map(mapProduct),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

async function getPublicById(id) {
  const p = await Product.findById(id).populate("category").lean();
  if (!p) return null;
  if (p.status !== "active") return null;
  return mapProduct(p);
}

module.exports = {
  createProduct,
  updateProduct,
  archiveProduct,
  deleteProductHard,
  listAdmin,
  listPublic,
  getPublicById,
};