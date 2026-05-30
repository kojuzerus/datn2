// models/variantModel.js
const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    variant_id:     { type: Number, required: true, unique: true },
    product_id:     { type: Number, required: true, index: true },
    color:          { type: String, default: "" },
    price:          { type: Number, required: true },
    sale_price:     { type: Number, default: null },
    stock_quantity: { type: Number, default: 0 },
    sku:            { type: String, default: "" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "product_variants",   // ← đúng tên collection trong MongoDB
  }
);

module.exports = mongoose.model("Variant", variantSchema);