const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  hoTen:       { type: String, required: true, trim: true },
  ngaySinh:    { type: Date, default: null },
  soDienThoai: { type: String, unique: true, sparse: true, trim: true },
  email:       { type: String, trim: true },
  matKhau:     { type: String, default: null },
  googleId:    { type: String, unique: true, sparse: true },
  zaloId:      { type: String, unique: true, sparse: true },
  facebookId:  { type: String, unique: true, sparse: true },
  avatar:      { type: String, default: null },
  // Cách đăng nhập gần nhất — chỉ để hiển thị UI ("Loại tài khoản"), không phải
  // danh sách các phương thức đã liên kết (xem googleId/facebookId/zaloId).
  lastLoginProvider: { type: String, enum: ["local", "google", "facebook", "zalo"], default: "local" },
  role:        { type: String, enum: ["user", "admin"], default: "user" },
  status:      { type: String, enum: ["active", "banned"], default: "active" },

  // Ví SmartHub: nhận tiền hoàn khi huỷ đơn đã thanh toán online (VNPay/ví),
  // dùng được để thanh toán đơn khác sau này (xem walletController.js).
  soDuVi:      { type: Number, default: 0, min: 0 },

  // Đặt lại mật khẩu qua email: chỉ lưu bản hash của token (không lưu token thô),
  // giống nguyên tắc lưu mật khẩu — để lộ DB cũng không dùng token được.
  resetPasswordTokenHash: { type: String, default: null, select: false },
  resetPasswordExpires:   { type: Date,   default: null, select: false },
}, { timestamps: true });

// Email lưu đúng nguyên dạng người dùng nhập (hoa/thường), nhưng kiểm tra trùng lặp
// không phân biệt hoa/thường (vì email thật không phân biệt hoa/thường)
userSchema.index(
  { email: 1 },
  { unique: true, sparse: true, collation: { locale: "en", strength: 2 } }
);

module.exports = mongoose.model("User", userSchema);