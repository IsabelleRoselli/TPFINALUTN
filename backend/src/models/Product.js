const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priceCents: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ["active", "archived"], default: "active" },

    // CAMBIO CLAVE: string para que puedas usar categorías/subcategorías por texto
    category: { type: mongoose.Schema.Types.ObjectId,
  ref: "Category",
  required: true },

    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);