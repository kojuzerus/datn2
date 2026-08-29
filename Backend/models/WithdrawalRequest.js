const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "BankAccount", required: true },
    amount: { type: Number, required: true }, // Số tiền rút
    status: {
      type: String,
      enum: ["cho_xac_nhan", "da_xac_nhan", "hoan_tat", "da_huy"],
      default: "cho_xac_nhan", // chờ xác nhận → đã xác nhận → hoàn tất
    },
    note: { type: String, default: "" }, // Ghi chú từ admin (lý do từ chối, v.v.)
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date }, // Ngày xử lý
    transactionCode: { type: String }, // Mã giao dịch từ cổng thanh toán (nếu có)
  },
  { timestamps: true }
);

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
