const mongoose = require("mongoose");

// Email đăng ký nhận tin khuyến mãi ở footer — tách riêng khỏi User vì khách
// không cần tài khoản mới đăng ký nhận tin được.
const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  },
  {
    timestamps: { createdAt: "subscribed_at", updatedAt: false },
    collection: "newsletter_subscribers",
  }
);

module.exports = mongoose.model("NewsletterSubscriber", newsletterSchema);
