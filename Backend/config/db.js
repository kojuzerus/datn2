const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/SMARTHUB";

// ── Kết nối MongoDB dùng CHUNG giữa các lần gọi (quan trọng cho serverless) ──
// Trên Vercel, mỗi request có thể chạy trên 1 instance hàm serverless khác
// nhau, nhưng trong CÙNG 1 instance (khi nó còn "ấm" — chưa bị Vercel tắt),
// biến toàn cục này vẫn còn nguyên trong bộ nhớ giữa các lần gọi. Cache lại
// promise kết nối để lần gọi sau dùng lại thay vì mở kết nối TLS mới mỗi lần
// (mở mới tốn 1-3s, chính là nguyên nhân web load chậm khi deploy serverless).
let cachedConnPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!cachedConnPromise) {
    cachedConnPromise = mongoose
      .connect(MONGO_URI, {
        // Không chờ chọn server quá lâu — lỗi thì báo nhanh thay vì client bị treo
        serverSelectionTimeoutMS: 8000,
        // Serverless: giới hạn pool nhỏ vì mỗi instance chỉ xử lý ít request đồng thời
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log("✅ MongoDB connected (cached for reuse)");
        return m;
      })
      .catch((err) => {
        cachedConnPromise = null; // lỗi thì bỏ cache, lần sau thử kết nối lại
        throw err;
      });
  }

  return cachedConnPromise;
}

module.exports = connectDB;
