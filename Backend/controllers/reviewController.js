const Review  = require("../models/reviewModel");
const Order   = require("../models/orderModel");
const Product = require("../models/productModel");
const User    = require("../models/User");

// ── Helper: tính lại điểm trung bình + số đánh giá hiển thị của sản phẩm ────
async function recomputeProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product_id: productId, status: "visible" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avg   = stats.length ? Math.round(stats[0].avg * 10) / 10 : 0;
  const count = stats.length ? stats[0].count : 0;
  await Product.updateOne({ product_id: productId }, { avg_rating: avg, review_count: count });
  return { avg, count };
}

// ── Helper: tìm đơn ĐÃ GIAO của user có chứa sản phẩm ───────────────────────
async function findDeliveredOrder(userId, productId) {
  return Order.findOne({
    userId,
    trangThai: "da_giao",
    "items.productId": String(productId),
  }).select("_id").lean();
}

// ── [GET] /api/reviews/product/:productId — public: đánh giá hiển thị ───────
exports.getByProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId))
      return res.status(400).json({ success: false, message: "Mã sản phẩm không hợp lệ" });

    const reviews = await Review.find({ product_id: productId, status: "visible" })
      .select("-userId -orderId")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Phân bố sao 1-5
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { distribution[r.rating]++; });

    res.json({ success: true, data: reviews, distribution });
  } catch (err) {
    console.error("[reviews getByProduct]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/reviews/can-review/:productId — user: có được đánh giá không ─
exports.canReview = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId))
      return res.status(400).json({ success: false, message: "Mã sản phẩm không hợp lệ" });

    const [order, existing] = await Promise.all([
      findDeliveredOrder(req.userId, productId),
      Review.findOne({ product_id: productId, userId: req.userId })
        .select("rating content")
        .lean(),
    ]);

    res.json({
      success: true,
      canReview: !!order,
      hasReviewed: !!existing,
      myReview: existing || null,
    });
  } catch (err) {
    console.error("[reviews canReview]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [POST] /api/reviews — user: gửi/cập nhật đánh giá (phải mua hàng rồi) ───
exports.create = async (req, res) => {
  try {
    const productId = parseInt(req.body.productId);
    const rating    = parseInt(req.body.rating);
    const content   = (req.body.content || "").trim();

    if (isNaN(productId))
      return res.status(400).json({ success: false, message: "Mã sản phẩm không hợp lệ" });
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: "Vui lòng chọn số sao từ 1 đến 5" });
    if (content.length > 1000)
      return res.status(400).json({ success: false, message: "Nội dung tối đa 1000 ký tự" });

    const product = await Product.findOne({ product_id: productId }).select("product_id");
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    // Điều kiện bắt buộc: có đơn hàng ĐÃ GIAO chứa sản phẩm này
    const order = await findDeliveredOrder(req.userId, productId);
    if (!order)
      return res.status(403).json({
        success: false,
        message: "Chỉ khách hàng đã mua và nhận sản phẩm mới có thể đánh giá",
      });

    const user = await User.findById(req.userId).select("hoTen");
    if (!user) return res.status(401).json({ success: false, message: "Tài khoản không hợp lệ" });

    // Upsert: đã đánh giá rồi thì cập nhật
    const review = await Review.findOneAndUpdate(
      { product_id: productId, userId: req.userId },
      {
        product_id: productId,
        userId: req.userId,
        userName: user.hoTen || "Người dùng",
        orderId: order._id,
        rating,
        content,
        status: "visible",
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const { avg, count } = await recomputeProductRating(productId);

    const { userId, orderId, ...safe } = review.toObject();
    res.status(201).json({
      success: true,
      message: "Cảm ơn bạn đã đánh giá sản phẩm!",
      data: safe,
      productRating: { avg_rating: avg, review_count: count },
    });
  } catch (err) {
    console.error("[reviews create]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/reviews/admin/all — admin: danh sách toàn bộ đánh giá ────────
exports.getAllAdmin = async (req, res) => {
  try {
    const { search = "", rating = "", status = "", page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (rating) filter.rating = parseInt(rating);
    if (search) {
      const re = new RegExp(search.trim(), "i");
      filter.$or = [{ userName: re }, { content: re }];
    }

    const pageNum  = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const [total, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    // Gắn tên + ảnh sản phẩm
    const productIds = [...new Set(reviews.map((r) => r.product_id))];
    const products = await Product.find({ product_id: { $in: productIds } })
      .select("product_id product_name thumbnail slug")
      .lean();
    const productMap = {};
    products.forEach((p) => { productMap[p.product_id] = p; });

    const data = reviews.map((r) => ({
      ...r,
      product: productMap[r.product_id] || null,
    }));

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.max(1, Math.ceil(total / limitNum)) },
    });
  } catch (err) {
    console.error("[reviews getAllAdmin]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [PUT] /api/reviews/:id/visibility — admin: ẩn/hiện đánh giá ─────────────
exports.toggleVisibility = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });

    review.status = review.status === "visible" ? "hidden" : "visible";
    await review.save();
    await recomputeProductRating(review.product_id);

    res.json({
      success: true,
      message: review.status === "visible" ? "Đã hiện đánh giá" : "Đã ẩn đánh giá",
      data: { status: review.status },
    });
  } catch (err) {
    console.error("[reviews toggleVisibility]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [DELETE] /api/reviews/:id — admin: xóa đánh giá ─────────────────────────
exports.remove = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
    await recomputeProductRating(review.product_id);
    res.json({ success: true, message: "Đã xóa đánh giá" });
  } catch (err) {
    console.error("[reviews remove]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
