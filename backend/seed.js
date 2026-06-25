const path = require('path');
const mongoose = require('mongoose');
const Category = require('./src/models/Category');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const categories = [
  { name: "Flores y Ramos" },
  { name: "Orquídeas" },
  { name: "Plantas" },
  { name: "Regalos" },
  { name: "Peluches" },
  { name: "Boxes" },
  { name: "Eventos / Ocasiones" },
  { name: "Condolencias / En memoria" },
  { name: "Varios" }
];

async function seed() {
  try {
    if (!MONGO_URI) {
      throw new Error("Falta MONGODB_URI o MONGO_URI en backend/.env");
    }

    await mongoose.connect(MONGO_URI);
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log("✔ Categorías insertadas correctamente");
    process.exit();
  } catch (e) {
    console.error("Error al insertar categorías", e);
    process.exit(1);
  }
}

seed();
