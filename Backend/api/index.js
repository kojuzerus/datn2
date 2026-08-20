// Entry point riêng cho Vercel Serverless Functions.
// Vercel tự nhận file trong thư mục /api làm 1 hàm serverless — kết hợp với
// vercel.json (rewrite mọi đường dẫn về đây), toàn bộ app Express chạy qua
// đúng 1 hàm này. Đảm bảo kết nối MongoDB đã sẵn sàng (dùng lại cache ở
// config/db.js) TRƯỚC khi giao request cho Express xử lý.
const app = require("../app");
const connectDB = require("../config/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    return res.status(500).json({ success: false, message: "Không thể kết nối cơ sở dữ liệu" });
  }
  return app(req, res);
};
