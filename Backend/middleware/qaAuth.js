const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET || "smarthub_secret_2024";

// Middleware để xác thực người dùng
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "Không có token xác thực" });

  try {
    const decoded = jwt.verify(header.split(" ")[1], SECRET);
    req.userId = decoded.id;

    const user = await User.findById(decoded.id).select("hoTen role status");
    if (!user)
      return res.status(401).json({ message: "Người dùng không tồn tại" });
    if (user.status === "banned")
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });

    req.user = {
      id: user._id.toString(),
      name: user.hoTen,
      role: user.role,
    };

    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

// Middleware để xác thực admin
const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role status");
    if (!user || user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền truy cập" });
    if (user.status === "banned")
      return res
        .status(403)
        .json({ success: false, message: "Tài khoản đã bị khóa" });

    next();
  } catch {
    res.status(401).json({ success: false, message: "Xác thực thất bại" });
  }
};

module.exports = { protect, adminOnly };
