const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const BankAccount = require("../models/BankAccount");
const WithdrawalRequest = require("../models/WithdrawalRequest");

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

// ──────────────────── QUẢN LÝ TÀI KHOẢN NGÂN HÀNG ────────────────────

// POST /api/wallet/bank-accounts — Thêm tài khoản ngân hàng
exports.addBankAccount = async (req, res) => {
  try {
    const { accountName, accountNumber, bankCode, bankName } = req.body;
    if (!accountName || !accountNumber || !bankCode || !bankName) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
    }

    // Kiểm tra đã có tài khoản chưa
    const existing = await BankAccount.findOne({ userId: req.userId, accountNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: "Tài khoản này đã được thêm" });
    }

    const bankAccount = await BankAccount.create({
      userId: req.userId,
      accountName,
      accountNumber,
      bankCode,
      bankName,
    });

    res.json({ success: true, message: "Thêm tài khoản ngân hàng thành công", data: bankAccount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
  }
};

// GET /api/wallet/bank-accounts — Lấy danh sách tài khoản ngân hàng
exports.getBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ userId: req.userId }).lean();
    res.json({ success: true, data: accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE /api/wallet/bank-accounts/:id — Xóa tài khoản ngân hàng
exports.deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await BankAccount.findOneAndDelete({ _id: id, userId: req.userId });
    if (!account) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại" });
    }
    res.json({ success: true, message: "Xóa tài khoản thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ──────────────────── YÊU CẦU RÚT TIỀN ────────────────────

// POST /api/wallet/withdraw — Gửi yêu cầu rút tiền
exports.requestWithdrawal = async (req, res) => {
  try {
    const { bankAccountId, amount } = req.body;

    // Kiểm tra thông tin
    if (!bankAccountId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Thông tin không hợp lệ" });
    }

    // Kiểm tra tài khoản ngân hàng tồn tại
    const bankAccount = await BankAccount.findOne({ _id: bankAccountId, userId: req.userId });
    if (!bankAccount) {
      return res.status(404).json({ success: false, message: "Tài khoản ngân hàng không tồn tại" });
    }

    // Kiểm tra số dư ví
    const user = await User.findById(req.userId).select("soDuVi");
    if (!user || user.soDuVi < amount) {
      return res.status(400).json({ success: false, message: "Số dư ví không đủ" });
    }

    // Kiểm tra yêu cầu rút tiền đang chờ xác nhận
    const pending = await WithdrawalRequest.findOne({
      userId: req.userId,
      status: "cho_xac_nhan",
    });
    if (pending) {
      return res.status(400).json({
        success: false,
        message: "Bạn có yêu cầu rút tiền đang chờ xác nhận. Vui lòng chờ xử lý hoặc hủy yêu cầu trước.",
      });
    }

    // Trừ tiền ví ngay lập tức
    await User.findByIdAndUpdate(
      req.userId,
      { $inc: { soDuVi: -amount } },
      { new: true }
    );

    // Tạo yêu cầu rút tiền
    const withdrawalRequest = await WithdrawalRequest.create({
      userId: req.userId,
      bankAccountId,
      amount,
    });

    // Lưu giao dịch
    await WalletTransaction.create({
      userId: req.userId,
      type: "rut_tien",
      amount,
      soDuSau: user.soDuVi - amount,
      note: `Rút tiền sang tài khoản ${bankAccount.accountNumber}`,
    });

    res.json({
      success: true,
      message: "Gửi yêu cầu rút tiền thành công. Admin sẽ xử lý trong 1-2 ngày làm việc.",
      data: withdrawalRequest,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
  }
};

// GET /api/wallet/withdrawals — Lấy danh sách yêu cầu rút tiền
exports.getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await WithdrawalRequest.find({ userId: req.userId })
      .populate("bankAccountId", "accountName accountNumber bankName")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// POST /api/wallet/withdrawals/:id/cancel — Hủy yêu cầu rút tiền (chỉ khi chờ xác nhận)
exports.cancelWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await WithdrawalRequest.findOne({ _id: id, userId: req.userId });

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Yêu cầu không tồn tại" });
    }

    if (withdrawal.status !== "cho_xac_nhan") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy yêu cầu đang chờ xác nhận",
      });
    }

    // Hoàn lại tiền vào ví
    await User.findByIdAndUpdate(
      req.userId,
      { $inc: { soDuVi: withdrawal.amount } },
      { new: true }
    );

    // Cập nhật trạng thái
    withdrawal.status = "da_huy";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Ghi giao dịch hoàn lại
    const user = await User.findById(req.userId).select("soDuVi");
    await WalletTransaction.create({
      userId: req.userId,
      type: "hoan_tien",
      amount: withdrawal.amount,
      soDuSau: user.soDuVi,
      note: "Hoàn tiền từ yêu cầu rút tiền bị hủy",
    });

    res.json({ success: true, message: "Hủy yêu cầu rút tiền thành công. Tiền đã hoàn lại ví." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
