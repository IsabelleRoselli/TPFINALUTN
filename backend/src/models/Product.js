const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priceCents: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    category: { type: String, default: "" }, // String, no ObjectId
    subcategory: { type: String, default: "" }, // Nueva subcategoría
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
