const jwt    = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "smarthub_secret_2024";

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "Không có token xác thực" });

  try {
    const decoded = jwt.verify(header.split(" ")[1], SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};