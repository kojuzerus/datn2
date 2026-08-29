const mongoose = require("mongoose");

const bankAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    accountName: { type: String, required: true }, // Tên chủ tài khoản
    accountNumber: { type: String, required: true }, // Số tài khoản
    bankCode: { type: String, required: true }, // Mã ngân hàng (VCB, ACB, ...)
    bankName: { type: String, required: true }, // Tên ngân hàng
    isDefault: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false }, // Xác thực qua giao dịch thử
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankAccount", bankAccountSchema);
