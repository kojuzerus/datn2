const mongoose = require("mongoose");

const newsCommentSchema = new mongoose.Schema(
  {
    newsId:   { type: mongoose.Schema.Types.ObjectId, ref: "News", required: true, index: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Snapshot tên người bình luận (tránh join khi hiển thị)
    userName: { type: String, required: true },

    content:  { type: String, required: true, trim: true, maxlength: 1000 },

    // Phản hồi của quản trị viên (1 phản hồi cho mỗi bình luận)
    reply: {
      content:   { type: String, default: "" },
      adminName: { type: String, default: "" },
      createdAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsComment", newsCommentSchema);
