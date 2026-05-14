const categoryService = require("../services/categoryService");

async function create(req, res) {
  try {
    const created = await categoryService.createCategory(req.body);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function list(req, res) {
  try {
    const items = await categoryService.listCategories();
    res.json({ items });
  } catch {
    res.status(500).json({ error: "Error servidor" });
  }
}

async function getById(req, res) {
  try {
    const item = await categoryService.getCategoryById(req.params.id);
    if (!item) return res.status(404).json({ error: "No existe" });
    res.json(item);
  } catch {
    res.status(400).json({ error: "ID inválido" });
  }
}

async function update(req, res) {
  try {
    const updated = await categoryService.updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "No existe" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function remove(req, res) {
  try {
    const deleted = await categoryService.deleteCategory(req.params.id);
    if (!deleted) return res.status(404).json({ error: "No existe" });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "ID inválido" });
  }
}

module.exports = { create, list, getById, update, remove };