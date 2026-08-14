const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "smarthub_secret_2024";

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "Không có token xác thực" });

  try {
    const decoded = jwt.verify(header.split(" ")[1], SECRET);

    console.log("[auth] decoded =", decoded); // ← log tạm, xóa sau khi xong

    req.userId = decoded.id || decoded._id || decoded.userId;
    req.user = { ...decoded, _id: req.userId, id: req.userId };

    console.log("[auth] userId =", req.userId); // ← log tạm

    next();
  } catch (err) {
    console.log("[auth] verify failed:", err.message); // ← log tạm
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
