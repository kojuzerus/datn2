const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.js"); // Đường dẫn tới middleware auth của bạn
const User = require("../models/User");

router.get("/userinfo", authMiddleware, async (req, res) => {
  try {
    // Vì đã đi qua authMiddleware, ID người dùng đã nằm sẵn trong req.userId
    const userId = req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const user = await User.findById(userId).select("-matKhau");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Trả về thông tin cơ bản cho cả Header và Form câu hỏi cùng đọc
    return res.json(user);
  } catch (error) {
    console.error("Lỗi API userinfo:", error);
    return res.status(500).json({ message: "Lỗi hệ thống server" });
  }
});

module.exports = router;
