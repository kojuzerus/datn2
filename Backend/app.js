const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const passport = require("./config/passport");

const questionRoutes = require("./routes/questionRoutes");
const productRoutes = require("./routes/product");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const categoryRoutes = require("./routes/category");
const brandRoutes = require("./routes/brand");
const aiRoutes = require("./routes/ai");
const addressRoutes = require("./routes/address");
const orderRoutes = require("./routes/order");
const vnpayRoutes = require("./routes/vnpay");
const statsRoutes = require("./routes/stats");
const userAdminRoutes = require("./routes/user");
const adminSearchRoutes = require("./routes/adminSearch");
const promotionRoutes = require("./routes/promotion");
const flashSaleRoutes = require("./routes/flashSale");
const publicVoucherRoutes = require("./routes/vouchers");
const spinVoucherRoutes = require("./routes/voucherRoutes");
const adminVoucherRoutes = require("./routes/adminVoucherRoutes");
const newsRoutes = require("./routes/news");
const reviewRoutes = require("./routes/review");
const chatRoutes = require("./routes/chat");

const siteSettingRoutes = require("./routes/siteSetting");
const newsletterRoutes = require("./routes/newsletter");
const walletRoutes = require("./routes/wallet");

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${PORT}`;

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);
// Mặc định express.json() chỉ nhận tối đa 100kb — avatar (frontend cho phép
// tới 2MB) gửi lên dạng base64 (phình ~37%) + JSON overhead nên dễ dàng vượt
// mốc này, bị từ chối thẳng ở tầng body-parser (PayloadTooLargeError) TRƯỚC
// khi vào tới route. Route vẫn trả 200 kiểu khác hoặc lỗi chung chung "Lỗi
// server" khiến FE tưởng đã lưu (preview vẫn hiện tạm ở client) nhưng thực ra
// chưa lưu gì — tải lại trang là ảnh "biến mất" vì DB chưa từng có gì.
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());

/* ─── Routes công khai ─── */
app.use("/api/questions", questionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/vnpay", vnpayRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/flash-sales", flashSaleRoutes);
app.use("/api/vouchers", publicVoucherRoutes);
app.use("/api/spin", spinVoucherRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/settings", siteSettingRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/wallet", walletRoutes);

/* ─── Routes admin ─── */
app.use("/api/admin/stats", statsRoutes);
app.use("/api/admin/users", userAdminRoutes);
app.use("/api/admin/search", adminSearchRoutes);
app.use("/api/admin/vouchers", adminVoucherRoutes);

app.get("/api/health", (_, res) =>
  res.json({ status: "ok", time: new Date().toISOString() }),
);

app.use((_, res) =>
  res.status(404).json({ success: false, message: "Route không tồn tại" }),
);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Lỗi server" });
});

// ── bin/www lo phần kết nối MongoDB và mở cổng ────────────────────────────
module.exports = app;
