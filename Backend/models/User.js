const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  hoTen:       { type: String, required: true, trim: true },
  ngaySinh:    { type: Date, default: null },
  soDienThoai: { type: String, unique: true, sparse: true, trim: true },
  email:       { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  matKhau:     { type: String, default: null },
  googleId:    { type: String, unique: true, sparse: true },
  zaloId:      { type: String, unique: true, sparse: true },
  role:        { type: String, enum: ["user", "admin"], default: "user" },
  status:      { type: String, enum: ["active", "banned"], default: "active" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);