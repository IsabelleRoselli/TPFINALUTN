const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("Falta MONGODB_URI o MONGO_URI en .env");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  console.log("MongoDB conectado");
}

module.exports = connectDB;