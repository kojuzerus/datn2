const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  hoTen:       { type: String, required: true, trim: true },
  ngaySinh:    { type: Date, default: null },
  soDienThoai: { type: String, unique: true, sparse: true, trim: true },
  email:       { type: String, trim: true },
  matKhau:     { type: String, default: null },
  googleId:    { type: String, unique: true, sparse: true },
  zaloId:      { type: String, unique: true, sparse: true },
  role:        { type: String, enum: ["user", "admin"], default: "user" },
  status:      { type: String, enum: ["active", "banned"], default: "active" },
}, { timestamps: true });

// Email lưu đúng nguyên dạng người dùng nhập (hoa/thường), nhưng kiểm tra trùng lặp
// không phân biệt hoa/thường (vì email thật không phân biệt hoa/thường)
userSchema.index(
  { email: 1 },
  { unique: true, sparse: true, collation: { locale: "en", strength: 2 } }
);

module.exports = mongoose.model("User", userSchema);