const Product = require("../models/productModel");
const Order   = require("../models/orderModel");
const User    = require("../models/User");
const mongoose = require("mongoose");

// GET /api/admin/search?q=...
exports.globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2)
      return res.json({ success: true, data: { products: [], orders: [], users: [] } });

    const re = new RegExp(q, "i");

    const [products, orders, users] = await Promise.all([
      Product.find({ product_name: re, status: "active" })
        .select("product_name slug thumbnail status")
        .limit(5)
        .lean(),

      Order.find({
        $or: [
          { receiverName: re },
          { phone: re },
          ...(mongoose.isValidObjectId(q) ? [{ _id: q }] : []),
        ],
      })
        .select("_id receiverName phone trangThai tongThanhToan createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      User.find({
        $or: [{ hoTen: re }, { email: re }, { soDienThoai: re }],
      })
        .select("hoTen email soDienThoai role status")
        .limit(5)
        .lean(),
    ]);

    res.json({ success: true, data: { products, orders, users } });
  } catch (err) {
    console.error("adminSearch error:", err);
    res.status(500).json({ success: false, message: "Lỗi tìm kiếm" });
  }
};
