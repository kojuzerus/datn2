const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    image_id:   { type: Number, required: true, unique: true },
    variant_id: { type: Number, required: true, index: true },
    image_url:  { type: String, default: "" },
    sort_order: { type: Number, default: 0 },
  },
  {
    timestamps: false,
    collection: "product_images",
  }
);

module.exports = mongoose.model("ProductImage", productImageSchema);
