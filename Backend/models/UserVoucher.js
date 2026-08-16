const mongoose = require("mongoose");

/**
 * UserVoucher = "phiếu thưởng" mà 1 user đã quay trúng.
 * - Dùng field unique (userId) để đảm bảo 1 user chỉ quay được 1 lần.
 * - isUsed dùng để đánh dấu đã áp dụng vào đơn hàng hay chưa.
 */
const userVoucherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // 🔒 CHẶN QUAY LẦN 2: mỗi user chỉ có tối đa 1 document
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    usedInOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserVoucher", userVoucherSchema);
