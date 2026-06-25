// Thêm vào app.js của bạn (Backend/app.js)
// Đây là phần cần thêm vào file app.js hiện tại của bạn

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// === MIDDLEWARE ===
app.use(cors({
  origin: 'http://localhost:3000', // URL frontend Next.js
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === KẾT NỐI MONGODB ===
console.log("MONGODB_URI =", process.env.MONGODB_URI);
console.log("Using URI =", MONGODB_URI);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarthub';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Kết nối MongoDB thành công'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// === ROUTES ===
// Route auth (đăng ký / đăng nhập)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Thêm các routes khác của bạn bên dưới
// const productRoutes = require('./routes/products');
// app.use('/api/products', productRoutes);

// === START SERVER ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});

module.exports = app;