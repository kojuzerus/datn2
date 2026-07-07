const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    slug:      { type: String, required: true, unique: true },
    thumbnail: { type: String, default: "" },

    // Mô tả ngắn hiển thị ở danh sách tin
    summary:   { type: String, default: "" },

    // Nội dung bài viết (HTML)
    content:   { type: String, required: true },

    author:    { type: String, default: "SmartHub" },
    views:     { type: Number, default: 0 },

    // Danh sách user đã thích bài viết
    likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    status:    { type: String, enum: ["published", "draft"], default: "published" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
