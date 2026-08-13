// models/Question.js
const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const questionSchema = new mongoose.Schema(
  {
    product: {
      type: String,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    replies: [replySchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Question", questionSchema);
