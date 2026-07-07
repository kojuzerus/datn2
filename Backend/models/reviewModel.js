const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product_id: { type: Number, required: true, index: true },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Snapshot tên người đánh giá
    userName:   { type: String, required: true },

    // Đơn hàng đã giao chứng minh người này mua sản phẩm
    orderId:    { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

    rating:     { type: Number, required: true, min: 1, max: 5 },
    content:    { type: String, default: "", trim: true, maxlength: 1000 },

    // Admin có thể ẩn đánh giá không phù hợp
    status:     { type: String, enum: ["visible", "hidden"], default: "visible" },
  },
  { timestamps: true }
);

// Mỗi người chỉ đánh giá 1 lần cho mỗi sản phẩm (gửi lại sẽ cập nhật)
reviewSchema.index({ product_id: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
