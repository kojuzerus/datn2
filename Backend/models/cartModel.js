const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId:  { type: String, required: true },
  tenSanPham: { type: String, required: true },
  hinhAnh:    { type: String, default: "" },
  gia:        { type: Number, required: true },
  soLuong:    { type: Number, required: true, min: 1 },
  variant:    { type: String, default: "" },
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items:  [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);