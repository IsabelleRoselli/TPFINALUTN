const Category = require("../models/Category");

async function getOrCreateByName(name) {
  if (!name) throw new Error("El nombre de la categoría es obligatorio");
  let cat = await Category.findOne({ name: name.trim() });
  console.log("[DEBUG] Buscando categoría por nombre:", name, "— Encontrada?", !!cat);
  if (cat) return cat;
  try {
    cat = await Category.create({ name: name.trim() });
    console.log("[DEBUG] Categoría creada OK:", cat);
  } catch (e) {
    console.error("[DEBUG] Falla creando categoría:", e);
    throw new Error("No se pudo crear la categoría: " + e.message);
  }
  return cat;
}

async function getById(id) {
  return Category.findById(id);
}

module.exports = { getOrCreateByName, getById };