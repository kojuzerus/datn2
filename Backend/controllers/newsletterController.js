const NewsletterSubscriber = require("../models/newsletterModel");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// [POST] /api/newsletter/subscribe — public: đăng ký nhận tin ở footer
exports.subscribe = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email))
      return res.status(400).json({ success: false, message: "Email không hợp lệ" });

    const existed = await NewsletterSubscriber.findOne({ email });
    if (existed)
      return res.json({ success: true, message: "Email này đã đăng ký nhận tin rồi!" });

    await NewsletterSubscriber.create({ email });
    res.status(201).json({ success: true, message: "Đăng ký thành công! Cảm ơn bạn đã theo dõi SmartHub." });
  } catch (err) {
    if (err.code === 11000)
      return res.json({ success: true, message: "Email này đã đăng ký nhận tin rồi!" });
    console.error("[newsletter subscribe]", err);
    res.status(500).json({ success: false, message: "Lỗi server, thử lại sau nhé" });
  }
};

// [GET] /api/newsletter — admin: danh sách email đã đăng ký (phân trang)
exports.getAll = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [total, data] = await Promise.all([
      NewsletterSubscriber.countDocuments(),
      NewsletterSubscriber.find().sort({ subscribed_at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);

    res.json({
      success: true,
      data,
      pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error("[newsletter getAll]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
