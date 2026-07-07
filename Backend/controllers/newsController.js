const News        = require("../models/newsModel");
const NewsComment = require("../models/newsCommentModel");
const User        = require("../models/User");
const jwt         = require("jsonwebtoken");
const SECRET      = process.env.JWT_SECRET || "smarthub_secret_2024";

// Lấy userId từ Bearer token nếu có (không bắt buộc đăng nhập)
function optionalUserId(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(header.split(" ")[1], SECRET).id;
  } catch {
    return null;
  }
}

function toSlug(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base, excludeId = null) {
  let slug = base || "bai-viet";
  let i = 1;
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await News.findOne(query).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

// ── [GET] /api/news — public: tin đã đăng, tìm kiếm + phân trang ────────────
exports.getPublished = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 9 } = req.query;

    const filter = { status: "published" };
    if (search) {
      const re = new RegExp(search.trim(), "i");
      filter.$or = [{ title: re }, { summary: re }];
    }

    const pageNum  = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 9, 30);

    const [total, news] = await Promise.all([
      News.countDocuments(filter),
      News.find(filter)
        .select("title slug thumbnail summary author views createdAt")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      data: news,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.max(1, Math.ceil(total / limitNum)) },
    });
  } catch (err) {
    console.error("[news getPublished]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/news/:slug — public: chi tiết bài viết + tăng lượt xem ───────
exports.getBySlug = async (req, res) => {
  try {
    const news = await News.findOneAndUpdate(
      { slug: req.params.slug, status: "published" },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    // 4 bài viết khác mới nhất để gợi ý đọc thêm
    const related = await News.find({ status: "published", _id: { $ne: news._id } })
      .select("title slug thumbnail summary createdAt")
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    // Trả lượt thích + trạng thái đã thích của người xem (không lộ danh sách userId)
    const userId = optionalUserId(req);
    const likes  = news.likes || [];
    const data   = {
      ...news,
      likes: undefined,
      likeCount: likes.length,
      liked: userId ? likes.some((id) => id.toString() === userId) : false,
    };

    res.json({ success: true, data, related });
  } catch (err) {
    console.error("[news getBySlug]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/news/admin/all — admin: tất cả tin, lọc trạng thái ───────────
exports.getAllAdmin = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(search.trim(), "i");
      filter.$or = [{ title: re }, { summary: re }];
    }

    const pageNum  = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const [total, news] = await Promise.all([
      News.countDocuments(filter),
      News.find(filter)
        .select("-content")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      data: news,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.max(1, Math.ceil(total / limitNum)) },
    });
  } catch (err) {
    console.error("[news getAllAdmin]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/news/admin/:id — admin: lấy đầy đủ 1 bài (kèm content) ───────
exports.getOneAdmin = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).lean();
    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    res.json({ success: true, data: news });
  } catch (err) {
    console.error("[news getOneAdmin]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [POST] /api/news — admin: tạo bài viết ──────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { title, thumbnail = "", summary = "", content, author = "SmartHub", status = "published" } = req.body;
    if (!title?.trim())   return res.status(400).json({ success: false, message: "Vui lòng nhập tiêu đề" });
    if (!content?.trim()) return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung" });

    const slug = await uniqueSlug(toSlug(title));
    const news = await News.create({
      title: title.trim(),
      slug,
      thumbnail,
      summary: summary.trim(),
      content,
      author: author.trim() || "SmartHub",
      status: status === "draft" ? "draft" : "published",
    });

    res.status(201).json({ success: true, message: "Đã tạo bài viết", data: news });
  } catch (err) {
    console.error("[news create]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [PUT] /api/news/:id — admin: cập nhật bài viết ──────────────────────────
exports.update = async (req, res) => {
  try {
    const { title, thumbnail = "", summary = "", content, author = "SmartHub", status = "published" } = req.body;
    if (!title?.trim())   return res.status(400).json({ success: false, message: "Vui lòng nhập tiêu đề" });
    if (!content?.trim()) return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung" });

    const existing = await News.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    // Chỉ sinh slug mới khi tiêu đề đổi (giữ URL cũ ổn định)
    const slug = title.trim() !== existing.title
      ? await uniqueSlug(toSlug(title), existing._id)
      : existing.slug;

    existing.title     = title.trim();
    existing.slug      = slug;
    existing.thumbnail = thumbnail;
    existing.summary   = summary.trim();
    existing.content   = content;
    existing.author    = author.trim() || "SmartHub";
    existing.status    = status === "draft" ? "draft" : "published";
    await existing.save();

    res.json({ success: true, message: "Đã cập nhật bài viết", data: existing });
  } catch (err) {
    console.error("[news update]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [DELETE] /api/news/:id — admin: xóa bài viết ────────────────────────────
exports.remove = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    await NewsComment.deleteMany({ newsId: news._id });
    res.json({ success: true, message: "Đã xóa bài viết" });
  } catch (err) {
    console.error("[news remove]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [POST] /api/news/:id/like — user: thích / bỏ thích ──────────────────────
exports.toggleLike = async (req, res) => {
  try {
    const news = await News.findOne({ _id: req.params.id, status: "published" });
    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    const idx = news.likes.findIndex((id) => id.toString() === req.userId);
    if (idx >= 0) news.likes.splice(idx, 1);
    else news.likes.push(req.userId);
    await news.save();

    res.json({ success: true, liked: idx < 0, likeCount: news.likes.length });
  } catch (err) {
    console.error("[news toggleLike]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/news/:id/comments — public: danh sách bình luận ──────────────
exports.getComments = async (req, res) => {
  try {
    const comments = await NewsComment.find({ newsId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("-userId")
      .lean();
    res.json({ success: true, data: comments });
  } catch (err) {
    console.error("[news getComments]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [POST] /api/news/:id/comments — user: thêm bình luận ────────────────────
exports.addComment = async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    if (!content) return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung bình luận" });
    if (content.length > 1000)
      return res.status(400).json({ success: false, message: "Bình luận tối đa 1000 ký tự" });

    const news = await News.findOne({ _id: req.params.id, status: "published" }).select("_id");
    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    const user = await User.findById(req.userId).select("hoTen");
    if (!user) return res.status(401).json({ success: false, message: "Tài khoản không hợp lệ" });

    const comment = await NewsComment.create({
      newsId: news._id,
      userId: req.userId,
      userName: user.hoTen || "Người dùng",
      content,
    });

    const { userId, ...safe } = comment.toObject();
    res.status(201).json({ success: true, message: "Đã gửi bình luận", data: safe });
  } catch (err) {
    console.error("[news addComment]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [PUT] /api/news/comments/:commentId/reply — admin: trả lời bình luận ────
exports.replyComment = async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    if (!content) return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung trả lời" });

    const admin = await User.findById(req.userId).select("hoTen");
    const comment = await NewsComment.findByIdAndUpdate(
      req.params.commentId,
      { reply: { content, adminName: admin?.hoTen || "Quản trị viên", createdAt: new Date() } },
      { new: true }
    ).select("-userId").lean();
    if (!comment) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });

    res.json({ success: true, message: "Đã trả lời bình luận", data: comment });
  } catch (err) {
    console.error("[news replyComment]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [DELETE] /api/news/comments/:commentId — admin: xóa bình luận ───────────
exports.deleteComment = async (req, res) => {
  try {
    const comment = await NewsComment.findByIdAndDelete(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
    res.json({ success: true, message: "Đã xóa bình luận" });
  } catch (err) {
    console.error("[news deleteComment]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
