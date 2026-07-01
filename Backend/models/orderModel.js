const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId:  { type: String, required: true },
  tenSanPham: { type: String, required: true },
  hinhAnh:    { type: String, default: "" },
  gia:        { type: Number, required: true },
  soLuong:    { type: Number, required: true, min: 1 },
  variant:    { type: String, default: "" },
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items:  [orderItemSchema],

  // Snapshot địa chỉ giao hàng
  receiverName:  { type: String, required: true },
  phone:         { type: String, required: true },
  province:      { type: String, required: true },
  district:      { type: String, required: true },
  ward:          { type: String, required: true },
  detailAddress: { type: String, required: true },

  paymentMethod: {
    type: String,
    enum: ["cod", "banking", "vnpay"],
    default: "cod",
  },

  tongTien:       { type: Number, required: true },
  phiGiaoHang:   { type: Number, default: 0 },
  tongThanhToan:  { type: Number, required: true },

  ghiChu:     { type: String, default: "" },
  lyDoHuy:    { type: String, default: "" },

  trangThai: {
    type: String,
    enum: ["cho_xac_nhan", "da_xac_nhan", "dang_giao", "da_giao", "da_huy"],
    default: "cho_xac_nhan",
  },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
