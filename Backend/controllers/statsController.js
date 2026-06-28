const Order   = require("../models/orderModel");
const User    = require("../models/User");
const Product = require("../models/productModel");
const Variant = require("../models/variantModel");

const CAT_COLORS = ["#D32F2F", "#378ADD", "#1D9E75", "#BA7517"];

function fmtShort(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e6)  return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
}

function pctChange(curr, prev) {
  if (prev === 0) return curr === 0 ? "0%" : "+100%";
  const pct = ((curr - prev) / prev) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

function relativeTime(date) {
  if (!date) return "—";
  const min = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (!Number.isFinite(min)) return "—";
  if (min < 1)  return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr} giờ trước`;
  return `${Math.floor(hr / 24)} ngày trước`;
}

function getRange(period) {
  const now = new Date();
  let start, prevStart, prevEnd;

  if (period === "week") {
    const offset = (now.getDay() + 6) % 7; // Thứ 2 = 0
    start = new Date(now); start.setDate(now.getDate() - offset); start.setHours(0, 0, 0, 0);
    prevEnd = new Date(start.getTime() - 1);
    prevStart = new Date(prevEnd); prevStart.setDate(prevEnd.getDate() - 6); prevStart.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd = new Date(start.getTime() - 1);
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
    prevStart = new Date(now.getFullYear() - 1, 0, 1);
    prevEnd = new Date(start.getTime() - 1);
  } else {
    start = new Date(now); start.setHours(0, 0, 0, 0);
    prevEnd = new Date(start.getTime() - 1);
    prevStart = new Date(prevEnd); prevStart.setHours(0, 0, 0, 0);
  }
  return { start, end: now, prevStart, prevEnd };
}

function periodLabel(period, start) {
  const d2 = (n) => String(n).padStart(2, "0");
  const now = new Date();
  if (period === "day")   return `Hôm nay, ${d2(now.getDate())}/${d2(now.getMonth() + 1)}/${now.getFullYear()}`;
  if (period === "week")  return `Tuần này, từ ${d2(start.getDate())}/${d2(start.getMonth() + 1)}/${start.getFullYear()}`;
  if (period === "month") return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
  return `Năm ${now.getFullYear()} (đến nay)`;
}

function buildTrendBuckets(period, orders) {
  let labels, bucketFn;
  if (period === "day") {
    labels = ["0h", "4h", "8h", "12h", "16h", "20h"];
    bucketFn = (d) => Math.min(5, Math.floor(d.getHours() / 4));
  } else if (period === "week") {
    labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    bucketFn = (d) => (d.getDay() + 6) % 7;
  } else if (period === "month") {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil(daysInMonth / 7);
    labels = Array.from({ length: weeks }, (_, i) => `Tuần ${i + 1}`);
    bucketFn = (d) => Math.min(weeks - 1, Math.floor((d.getDate() - 1) / 7));
  } else {
    labels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    bucketFn = (d) => d.getMonth();
  }
  const sums = new Array(labels.length).fill(0);
  orders.forEach((o) => { sums[bucketFn(new Date(o.createdAt))] += o.tongThanhToan; });
  return { labels, data: sums.map((v) => Math.round((v / 1e6) * 10) / 10) };
}

// ── [GET] /api/admin/stats/dashboard?period=day|week|month|year ───────────
exports.getDashboardStats = async (req, res) => {
  try {
    const period = ["day", "week", "month", "year"].includes(req.query.period) ? req.query.period : "day";
    const { start, end, prevStart, prevEnd } = getRange(period);

    const [ordersCurr, ordersPrev] = await Promise.all([
      Order.find({ createdAt: { $gte: start, $lte: end } }).lean(),
      Order.find({ createdAt: { $gte: prevStart, $lte: prevEnd } }).lean(),
    ]);

    const sumRevenue = (list) => list.filter((o) => o.trangThai !== "da_huy").reduce((s, o) => s + o.tongThanhToan, 0);
    const revenueCurr = sumRevenue(ordersCurr);
    const revenuePrev = sumRevenue(ordersPrev);
    const cancelCurr  = ordersCurr.filter((o) => o.trangThai === "da_huy").length;
    const cancelPrev  = ordersPrev.filter((o) => o.trangThai === "da_huy").length;

    const [usersCurr, usersPrev, productsActive, pendingOrders, newUsersToday] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd } }),
      Product.countDocuments({ status: "active" }),
      Order.countDocuments({ trangThai: "cho_xac_nhan" }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);

    const outOfStockAgg = await Variant.aggregate([
      { $group: { _id: "$product_id", totalStock: { $sum: "$stock_quantity" } } },
      { $match: { totalStock: 0 } },
      { $count: "count" },
    ]);
    const outOfStock = outOfStockAgg[0]?.count || 0;

    const doneCount    = ordersCurr.filter((o) => o.trangThai === "da_giao").length;
    const shipCount    = ordersCurr.filter((o) => o.trangThai === "dang_giao").length;
    const pendingCount = ordersCurr.filter((o) => ["cho_xac_nhan", "da_xac_nhan"].includes(o.trangThai)).length;

    // Doanh thu theo danh mục
    const validOrders = ordersCurr.filter((o) => o.trangThai !== "da_huy");
    const allItems = validOrders.flatMap((o) => o.items || []);
    const productIds = [...new Set(allItems.map((i) => parseInt(i.productId)).filter((n) => !isNaN(n)))];
    const products = await Product.find({ product_id: { $in: productIds } }).select("product_id category_name").lean();
    const catByProductId = {};
    products.forEach((p) => { catByProductId[p.product_id] = p.category_name || "Khác"; });

    const revenueByCategory = {};
    allItems.forEach((i) => {
      const cat = catByProductId[parseInt(i.productId)] || "Khác";
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + i.gia * i.soLuong;
    });
    const totalCatRevenue = Object.values(revenueByCategory).reduce((a, b) => a + b, 0) || 1;
    const catEntries = Object.entries(revenueByCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);

    const chart1 = {
      labels: catEntries.map(([name]) => name),
      data:   catEntries.map(([, rev]) => Math.round((rev / totalCatRevenue) * 100)),
      vals:   catEntries.map(([, rev]) => fmtShort(rev) + "₫"),
      colors: catEntries.map((_, i) => CAT_COLORS[i % CAT_COLORS.length]),
    };

    const bar = buildTrendBuckets(period, validOrders);

    res.json({
      success: true,
      data: {
        label: periodLabel(period, start),
        stats: {
          revenue: fmtShort(revenueCurr),
          orders:  String(ordersCurr.length),
          users:   String(usersCurr),
          cancel:  String(cancelCurr),
        },
        chg: {
          revenue: pctChange(revenueCurr, revenuePrev),
          orders:  pctChange(ordersCurr.length, ordersPrev.length),
          users:   pctChange(usersCurr, usersPrev),
          cancel:  pctChange(cancelCurr, cancelPrev),
        },
        chgUp: {
          revenue: revenueCurr >= revenuePrev,
          orders:  ordersCurr.length >= ordersPrev.length,
          users:   usersCurr >= usersPrev,
          cancel:  cancelCurr <= cancelPrev,
        },
        quickStrip: { productsActive, pendingOrders, outOfStock, newUsersToday },
        chart1,
        chart2: { vals: [String(doneCount), String(shipCount), String(pendingCount), String(cancelCurr)] },
        bar,
      },
    });
  } catch (err) {
    console.error("[getDashboardStats]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [GET] /api/admin/stats/recent-orders?limit=5 ───────────────────────────
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const orders = await Order.find().sort({ createdAt: -1 }).limit(limit).lean();

    const statusMap = {
      da_giao: "done", dang_giao: "ship",
      cho_xac_nhan: "pending", da_xac_nhan: "pending",
      da_huy: "cancel",
    };

    const data = orders.map((o) => {
      const items = o.items || [];
      const firstItem = items[0];
      const product = items.length > 1
        ? `${firstItem?.tenSanPham || ""} +${items.length - 1} sản phẩm`
        : (firstItem?.tenSanPham || "(không có sản phẩm)");
      return {
        id:         "#" + o._id.toString().slice(-5).toUpperCase(),
        orderId:    o._id.toString(),
        customer:   o.receiverName || "Khách hàng",
        product,
        amount:     fmtShort(o.tongThanhToan || 0) + "₫",
        statusType: statusMap[o.trangThai] || "pending",
        time:       relativeTime(o.createdAt),
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("[getRecentOrders]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};
