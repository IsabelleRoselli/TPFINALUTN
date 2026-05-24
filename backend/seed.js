const mongoose = require('mongoose');
const Category = require('./src/models/Category'); // cambia el path según dónde esté tu modelo Category

// 🚨 PONÉ TU URI DE MONGO REAL ACÁ:
const MONGO_URI = 'mongodb+srv://cattleyaAdmin:Artefloral26@cattleya.ug3lryr.mongodb.net/cattleya?retryWrites=true&w=majority&appName=cattleya';

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