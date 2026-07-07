const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
    description:     { type: String, default: "" },

    // percent: giảm theo % (discount_value = 10 nghĩa là 10%)
    // fixed:   giảm số tiền cố định (discount_value = 50000 nghĩa là 50.000đ)
    discount_type:   { type: String, enum: ["percent", "fixed"], required: true },
    discount_value:  { type: Number, required: true, min: 0 },

    // Trần giảm tối đa cho loại percent (null = không giới hạn)
    max_discount:    { type: Number, default: null },

    // Giá trị đơn hàng tối thiểu để áp mã
    min_order_value: { type: Number, default: 0 },

    // Tổng số lượt dùng cho phép (null = không giới hạn)
    usage_limit:     { type: Number, default: null },
    used_count:      { type: Number, default: 0 },

    start_date:      { type: Date, required: true },
    end_date:        { type: Date, required: true },

    status:          { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Promotion", promotionSchema);
