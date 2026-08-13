// routes/questionRoutes.js
const express = require("express");
const router = express.Router();
const {
  getQuestionsByProduct,
  createQuestion,
  createReply,
  deleteQuestion,
  deleteReply,
} = require("../controllers/questionController");
const { protect, adminOnly } = require("../middleware/qaAuth");

// Import Model Question chính xác
const Question = require("../models/Question");
const Product = require("../models/productModel");

/**
 * 🚀 API LẤY TOÀN BỘ CÂU HỎI CHO TRANG ADMIN
 * Endpoint hoàn chỉnh: GET http://localhost:5000/api/questions/admin
 */
router.get("/admin", protect, adminOnly, async (req, res) => {
  try {
    console.log("\n===== [ADMIN QUESTIONS] Bắt đầu xử lý =====");

    const questions = await Question.find().sort({ createdAt: -1 }).lean();
    console.log("1. Tổng số câu hỏi trong DB:", questions.length);

    if (questions.length > 0) {
      console.log("2. Mẫu câu hỏi đầu tiên:", {
        _id: questions[0]._id,
        product: questions[0].product,
        kieuDuLieu: typeof questions[0].product,
        userName: questions[0].userName,
      });
    }

    // Gom các product_id duy nhất rồi truy vấn 1 lần (tránh N+1 query)
    const ids = [
      ...new Set(
        questions.map((q) => Number(q.product)).filter((n) => !isNaN(n)),
      ),
    ];
    console.log("3. Danh sách product_id cần tra cứu:", ids);

    const products = await Product.find({ product_id: { $in: ids } })
      .select("product_id product_name slug thumbnail")
      .lean();
    console.log("4. Số sản phẩm tìm thấy:", products.length);

    if (products.length > 0) {
      console.log(
        "5. Sản phẩm tìm được:",
        products.map((p) => ({
          product_id: p.product_id,
          product_name: p.product_name,
          thumbnail: p.thumbnail,
        })),
      );
    } else if (ids.length > 0) {
      // Không khớp id nào -> in ra vài product_id đang có thật trong DB để so sánh
      const mau = await Product.find()
        .select("product_id product_name slug")
        .limit(5)
        .lean();
      console.log(
        "5. ⚠️ KHÔNG khớp id nào. Một vài product_id đang có trong DB:",
        mau.map((p) => ({ product_id: p.product_id, slug: p.slug })),
      );
    }

    const map = {};
    products.forEach((p) => (map[p.product_id] = p));

    const data = questions.map((q) => ({
      ...q,
      productInfo: map[Number(q.product)] || null,
    }));

    const soCoInfo = data.filter((d) => d.productInfo).length;
    console.log(
      `6. Kết quả: ${soCoInfo}/${data.length} câu hỏi có productInfo`,
    );
    console.log("===== [ADMIN QUESTIONS] Kết thúc =====\n");

    return res.status(200).json(data);
  } catch (error) {
    console.error("❌ Lỗi tại route /admin:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách câu hỏi Admin",
      error: error.message,
    });
  }
});

router.get("/products/:productId/questions", getQuestionsByProduct);

router.post("/products/:productId/questions", protect, createQuestion);
router.post("/:questionId/replies", protect, createReply);
router.delete("/:questionId", protect, adminOnly, deleteQuestion);

router.delete("/:questionId/replies/:replyId", protect, adminOnly, deleteReply);

module.exports = router;
