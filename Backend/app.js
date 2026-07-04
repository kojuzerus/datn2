const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");
require("dotenv").config();

const productRoutes  = require("./routes/product");
const authRoutes     = require("./routes/auth");
const cartRoutes     = require("./routes/cart");
const categoryRoutes = require("./routes/category");
const brandRoutes    = require("./routes/brand");
const aiRoutes       = require("./routes/ai");
const addressRoutes  = require("./routes/address");
const orderRoutes    = require("./routes/order");
const vnpayRoutes    = require("./routes/vnpay");
const statsRoutes    = require("./routes/stats");
const userAdminRoutes  = require("./routes/user");
const adminSearchRoutes = require("./routes/adminSearch");
const promotionRoutes  = require("./routes/promotion");
const newsRoutes       = require("./routes/news");

const app  = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${PORT}`;

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/products",   productRoutes);
app.use("/api/auth",       authRoutes);
app.use("/api/cart",       cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands",     brandRoutes);
app.use("/api/ai",         aiRoutes);
app.use("/api/addresses",  addressRoutes);
app.use("/api/orders",     orderRoutes);
app.use("/api/vnpay",      vnpayRoutes);
app.use("/api/admin/stats", statsRoutes);
app.use("/api/admin/users",  userAdminRoutes);
app.use("/api/admin/search", adminSearchRoutes);
app.use("/api/promotions",   promotionRoutes);
app.use("/api/news",         newsRoutes);

app.get("/api/health", (_, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

app.use((_, res) =>
  res.status(404).json({ success: false, message: "Route không tồn tại" })
);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Lỗi server" });
});

// ── Kết nối MongoDB rồi mới lắng nghe ─────────────────────────────────────
module.exports = app;