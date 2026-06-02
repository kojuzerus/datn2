const User    = require("../models/User");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "smarthub_secret_2024";

// ── Đăng ký ──────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { hoTen, ngaySinh, soDienThoai, email, matKhau } = req.body;

    if (!hoTen || !soDienThoai || !matKhau)
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });

    if (await User.findOne({ soDienThoai }))
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });

    if (email && await User.findOne({ email }))
      return res.status(400).json({ message: "Email đã được sử dụng" });

    const hash = await bcrypt.hash(matKhau, 10);
    const user = await User.create({ hoTen, ngaySinh: ngaySinh || null, soDienThoai, email: email || null, matKhau: hash });

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });
    res.status(201).json({ message: "Đăng ký thành công", token, user: { id: user._id, hoTen: user.hoTen, soDienThoai: user.soDienThoai, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── Đăng nhập ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { soDienThoai, matKhau } = req.body;

    if (!soDienThoai || !matKhau)
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });

    const user = await User.findOne({ soDienThoai });
    if (!user || !(await bcrypt.compare(matKhau, user.matKhau)))
      return res.status(401).json({ message: "Số điện thoại hoặc mật khẩu không đúng" });

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });
    res.json({ message: "Đăng nhập thành công", token, user: { id: user._id, hoTen: user.hoTen, soDienThoai: user.soDienThoai, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── Lấy thông tin user ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-matKhau");
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};