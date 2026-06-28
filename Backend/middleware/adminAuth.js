const jwt    = require("jsonwebtoken");
const User   = require("../models/User");
const SECRET = process.env.JWT_SECRET || "smarthub_secret_2024";

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "Không có token xác thực" });

  try {
    const decoded = jwt.verify(header.split(" ")[1], SECRET);
    const user = await User.findById(decoded.id).select("role status");
    if (!user || user.role !== "admin")
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
    if (user.status === "banned")
      return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa" });

    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
