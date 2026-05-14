const productService = require("../services/productService");

async function adminList(req, res) {
  try {
    const search = (req.query.search || "").toString().trim();
    const status = req.query.status ? req.query.status.toString().trim() : "";
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || "10", 10)));

    const result = await productService.listAdmin({ search, status, page, pageSize });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || "Error servidor" });
  }
}

async function adminCreate(req, res) {
  console.log("REQ.BODY EN ADMIN CREATE:", req.body); 
  try {
    const created = await productService.createProduct(req.body);
    res.status(201).json(created);
  } catch (e) {
    console.log("ERROR EN ADMIN CREATE:", e); 
    res.status(400).json({ error: e.message });
  }
}

async function adminUpdate(req, res) {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "No existe" });
    res.json(updated);
  } catch (e) {
      console.log("ERROR EN ADMIN CREATE:", e);
    res.status(400).json({ error: e.message });
  }
}

async function adminArchive(req, res) {
  try {
    const archived = await productService.archiveProduct(req.params.id);
    if (!archived) return res.status(404).json({ error: "No existe" });
    res.json(archived);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function publicList(req, res) {
  try {
    const search = (req.query.search || "").toString().trim();
    const category = (req.query.category || "").toString().trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || "50", 10)));

    const result = await productService.listPublic({ search, category, page, pageSize });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || "Error cargando productos" });
  }
}

async function publicGetById(req, res) {
  try {
    const product = await productService.getPublicById(req.params.id);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch {
    res.status(404).json({ error: "Producto no encontrado" });
  }
}

module.exports = { adminList, adminCreate, adminUpdate, adminArchive, publicList, publicGetById };