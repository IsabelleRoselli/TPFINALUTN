const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Category = require("../models/Category");

dotenv.config();

const categories = [
  "Flores y Ramos",
  "Orquídeas",
  "Plantas",
  "Regalos",
  "Peluches",
  "Boxes",
  "Eventos / Ocasiones",
];

async function main() {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  for (const name of categories) {
    const exists = await Category.findOne({ name });
    if (!exists) {
      await Category.create({ name });
      console.log(`Categoria creada: ${name}`);
    }
  }
  console.log("Inicialización de categorías completa");
  await conn.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});