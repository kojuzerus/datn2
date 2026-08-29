const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId:  { type: String, required: true },
  // Legacy field names kept readable so old cart items can be migrated safely.
  product_id: { type: String },
  tenSanPham: { type: String, required: true },
  product_name: { type: String },
  slug:       { type: String, default: "" },
  hinhAnh:    { type: String, default: "" },
  thumbnail:  { type: String },
  gia:        { type: Number, required: true },
  price:      { type: Number },
  soLuong:    { type: Number, required: true, min: 1 },
  quantity:   { type: Number },
  variant:    { type: String, default: "" },
});

cartItemSchema.pre("validate", function (next) {
  this.productId = this.productId || this.product_id;
  this.tenSanPham = this.tenSanPham || this.product_name;
  this.hinhAnh = this.hinhAnh || this.thumbnail || "";
  this.gia = this.gia ?? this.price;
  this.soLuong = this.soLuong ?? this.quantity;
  next();
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items:  [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);