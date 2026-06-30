require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("../models/User");

const OLD_PHONE = "admin"; // tài khoản tạm trước đó, cần dọn dẹp
const EMAIL     = "admin@smarthub.vn";
const PASSWORD  = "Admin@123";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const hash = await bcrypt.hash(PASSWORD, 10);

  // Dọn tài khoản tạm dùng "admin" làm số điện thoại (không hợp lệ)
  await User.deleteOne({ soDienThoai: OLD_PHONE });

  const existing = await User.findOne({ email: EMAIL });
  if (existing) {
    existing.role    = "admin";
    existing.status  = "active";
    existing.matKhau = hash;
    await existing.save();
    console.log("Đã cập nhật tài khoản admin có sẵn:", EMAIL);
  } else {
    await User.create({
      hoTen: "Quản trị viên",
      email: EMAIL,
      matKhau: hash,
      role: "admin",
      status: "active",
    });
    console.log("Đã tạo tài khoản admin mới:", EMAIL);
  }

  console.log("Email:", EMAIL, "| Mật khẩu:", PASSWORD);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
