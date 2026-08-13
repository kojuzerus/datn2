// controllers/questionController.js
const mongoose = require("mongoose");
const Question = require("../models/Question");
const Product = require("../models/productModel"); // ĐÃ SỬA: Khớp chính xác với file "productModel" của bạn
const User = require("../models/User");

// GET /api/products/:productId/questions
exports.getQuestionsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const isNumber = /^\d+$/.test(productId);
    const query = isNumber
      ? { product_id: parseInt(productId) }
      : { slug: productId };

    const product = await Product.findOne(query).lean();

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const questions = await Question.find({ product: product.product_id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(questions);
  } catch (err) {
    console.error("Lỗi tại getQuestionsByProduct:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// POST /api/products/:productId/questions  (cần đăng nhập)
exports.createQuestion = async (req, res) => {
  try {
    const { productId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung câu hỏi không được để trống" });
    }

    const isNumber = /^\d+$/.test(productId);
    const query = isNumber
      ? { product_id: parseInt(productId) }
      : { slug: productId };

    const product = await Product.findOne(query).lean();

    if (!product) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để đặt câu hỏi" });
    }

    // Lấy thông tin user từ database
    const user = await User.findById(req.userId).select('hoTen');
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const question = await Question.create({
      product: product.product_id,
      user: req.userId,
      userName: user.hoTen,
      content: content.trim(),
      replies: [],
    });

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.createReply = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung phản hồi không được để trống" });
    }

    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi" });
    }

    // Lấy thông tin user từ database
    const user = await User.findById(req.userId).select('hoTen role');
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const reply = {
      user: req.userId,
      userName: user.hoTen,
      isAdmin: user.role === "admin",
      content: content.trim(),
    };

    question.replies.push(reply);
    await question.save();

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// DELETE /api/questions/:questionId  (chỉ admin)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.questionId);
    if (!question) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi" });
    }
    res.json({ message: "Đã xoá câu hỏi" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// DELETE /api/questions/:questionId/replies/:replyId  (chỉ admin)
exports.deleteReply = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi" });
    }
    question.replies = question.replies.filter(
      (r) => r._id.toString() !== req.params.replyId,
    );
    await question.save();
    res.json({ message: "Đã xoá phản hồi" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
