const mongoose = require("mongoose");

/**
 * Lịch sử giao dịch Ví SmartHub — mỗi lần cộng/trừ số dư ví (User.soDuVi) đều
 * ghi lại 1 bản ghi ở đây để khách xem lại được (trang "Ví của tôi").
 * - "hoan_tien": cộng tiền vào ví (huỷ đơn đã thanh toán online/ví).
 * - "thanh_toan": trừ tiền khi dùng ví để thanh toán đơn hàng mới.
 * - "rut_tien": trừ tiền khi yêu cầu rút tiền sang tài khoản ngân hàng.
 */
const walletTransactionSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type:    { type: String, enum: ["hoan_tien", "thanh_toan", "rut_tien"], required: true },
    amount:  { type: Number, required: true, min: 0 }, // luôn dương — "type" quyết định cộng hay trừ
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    soDuSau: { type: Number, required: true }, // số dư ví NGAY SAU giao dịch này, để hiển thị lịch sử
    note:    { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
