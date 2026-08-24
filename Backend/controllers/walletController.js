const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// GET /api/wallet — số dư + lịch sử giao dịch ví của khách đang đăng nhập
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("soDuVi");
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });

    const transactions = await WalletTransaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, soDu: user.soDuVi, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/**
 * Cộng tiền vào ví (hoàn tiền huỷ đơn đã thanh toán online/ví) — dùng lại
 * từ orderController.js (createOrder/cancelOrder/updateOrderStatus), KHÔNG
 * phải route. Trả về số tiền đã hoàn (0 nếu không có gì để hoàn).
 */
exports.refundToWallet = async (userId, amount, orderId, note) => {
  if (!amount || amount <= 0) return 0;
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { soDuVi: amount } },
    { new: true }
  ).select("soDuVi");
  await WalletTransaction.create({
    userId, type: "hoan_tien", amount, orderId, soDuSau: user.soDuVi, note,
  });
  return amount;
};

/**
 * Trừ tiền trong ví để thanh toán đơn hàng mới — dùng lại từ createOrder().
 * Ném lỗi nếu số dư không đủ (gọi nơi dùng phải bọc try/catch hoặc kiểm tra
 * số dư trước bằng exports.getBalance).
 */
exports.chargeWallet = async (userId, amount, orderId, note) => {
  if (!amount || amount <= 0) return;
  const user = await User.findOneAndUpdate(
    { _id: userId, soDuVi: { $gte: amount } }, // điều kiện đủ số dư ngay trong query, tránh race condition trừ âm
    { $inc: { soDuVi: -amount } },
    { new: true }
  ).select("soDuVi");
  if (!user) {
    const err = new Error("Số dư ví không đủ để thanh toán đơn hàng này");
    err.code = "INSUFFICIENT_BALANCE";
    throw err;
  }
  await WalletTransaction.create({
    userId, type: "thanh_toan", amount, orderId, soDuSau: user.soDuVi, note,
  });
};

exports.getBalance = async (userId) => {
  const user = await User.findById(userId).select("soDuVi");
  return user?.soDuVi || 0;
};
