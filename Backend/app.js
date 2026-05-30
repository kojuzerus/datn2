const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const passport = require("./config/passport");

const productRoutes = require("./routes/product");
const authRoutes    = require("./routes/auth");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (_, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// 404
app.use((_, res) =>
  res.status(404).json({ success: false, message: "Route không tồn tại" })
);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Lỗi server" });
});

module.exports = app;