const Voucher = require("../models/Voucher");
const UserVoucher = require("../models/UserVoucher");

function pickRandomVoucher(vouchers) {
  const totalWeight = vouchers.reduce((sum, v) => sum + (v.weight || 1), 0);
  let rand = Math.random() * totalWeight;

  for (const v of vouchers) {
    rand -= v.weight || 1;
    if (rand <= 0) return v;
  }
  return vouchers[vouchers.length - 1];
}

exports.getPrizeList = async (req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      isActive: true,
      $or: [{ expiredAt: null }, { expiredAt: { $gt: now } }],
    })
      .sort({ _id: 1 })
      .select("code label type"); // không trả "value" để FE không lộ % giảm trước khi quay

    res.json(vouchers);
  } catch (err) {
    console.error("Lỗi getPrizeList:", err);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại" });
  }
};

/**
 * GET /api/vouchers/spin-status
 * Kiểm tra khách hàng đã quay chưa (để FE disable nút quay / show lại kết quả cũ)
 */
exports.getSpinStatus = async (req, res) => {
  try {
    const userId = req.userId; // gán bởi middleware/auth.js sau khi verify token

    const existing = await UserVoucher.findOne({ userId }).populate(
      "voucherId",
    );

    if (existing) {
      return res.json({
        hasSpun: true,
        voucher: {
          code: existing.code,
          label: existing.voucherId?.label,
          type: existing.voucherId?.type,
          value: existing.voucherId?.value,
          isUsed: existing.isUsed,
        },
      });
    }

    return res.json({ hasSpun: false });
  } catch (err) {
    console.error("Lỗi getSpinStatus:", err);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại" });
  }
};

/**
 * POST /api/vouchers/spin
 * Thực hiện quay: random voucher, lưu lại (chỉ 1 lần/khách), trả kết quả cho FE.
 */
exports.spinVoucher = async (req, res) => {
  try {
    const userId = req.userId;

    // Chặn quay lần 2
    const already = await UserVoucher.findOne({ userId });
    if (already) {
      return res.status(400).json({
        message: "Bạn đã sử dụng lượt quay của mình rồi!",
        alreadySpun: true,
      });
    }

    const now = new Date();
    const vouchers = await Voucher.find({
      isActive: true,
      $or: [{ expiredAt: null }, { expiredAt: { $gt: now } }],
    });

    if (!vouchers.length) {
      return res
        .status(400)
        .json({ message: "Chương trình quay số hiện không khả dụng" });
    }

    const wonVoucher = pickRandomVoucher(vouchers);

    // unique index trên userId sẽ tự chặn race-condition nếu bấm quay 2 lần liên tiếp
    await UserVoucher.create({
      userId,
      voucherId: wonVoucher._id,
      code: wonVoucher.code,
    });

    return res.json({
      message: "Quay thành công!",
      voucher: {
        code: wonVoucher.code,
        label: wonVoucher.label,
        type: wonVoucher.type,
        value: wonVoucher.value,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Bạn đã sử dụng lượt quay của mình rồi!" });
    }
    console.error("Lỗi spinVoucher:", err);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại" });
  }
};

/**
 * Hàm dùng chung: kiểm tra mã hợp lệ + tính số tiền giảm.
 * Dùng lại ở CẢ route "/apply" (chỉ xem trước) VÀ orderController lúc tạo đơn thật.
 * Throw Error(message) nếu mã không hợp lệ — nơi gọi tự bắt lỗi và trả về đúng message.
 */
async function calculateVoucherDiscount(userId, code, orderTotal) {
  const userVoucher = await UserVoucher.findOne({
    userId,
    code: code.toUpperCase(),
  }).populate("voucherId");

  if (!userVoucher) {
    throw new Error("Mã giảm giá không tồn tại hoặc không thuộc về bạn");
  }
  if (userVoucher.isUsed) {
    throw new Error("Mã giảm giá này đã được sử dụng");
  }

  const voucher = userVoucher.voucherId;
  if (!voucher || !voucher.isActive) {
    throw new Error("Mã giảm giá không hợp lệ");
  }
  if (voucher.expiredAt && voucher.expiredAt < new Date()) {
    throw new Error("Mã giảm giá đã hết hạn");
  }
  if (orderTotal < voucher.minOrderValue) {
    throw new Error(
      `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString(
        "vi-VN",
      )}đ mới áp dụng được mã này`,
    );
  }

  let discountAmount = 0;
  if (voucher.type === "percent") {
    discountAmount = (orderTotal * voucher.value) / 100;
    if (voucher.maxDiscount) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  } else if (voucher.type === "fixed") {
    discountAmount = voucher.value;
  } else if (voucher.type === "freeship") {
    discountAmount = 0; // xử lý riêng ở phần phí ship
  } else {
    throw new Error("Mã này không thể áp dụng cho đơn hàng");
  }

  discountAmount = Math.min(discountAmount, orderTotal);

  return {
    code: voucher.code,
    type: voucher.type,
    discountAmount,
    isFreeship: voucher.type === "freeship",
    finalTotal: orderTotal - discountAmount,
  };
}

/**
 * POST /api/vouchers/apply
 */
exports.applyVoucher = async (req, res) => {
  try {
    const userId = req.userId;
    const { code, orderTotal } = req.body;

    if (!code || orderTotal === undefined) {
      return res
        .status(400)
        .json({ message: "Thiếu thông tin mã giảm giá hoặc tổng đơn hàng" });
    }

    const result = await calculateVoucherDiscount(userId, code, orderTotal);
    return res.json({ message: "Áp dụng mã giảm giá thành công", ...result });
  } catch (err) {
    console.error("Lỗi applyVoucher:", err.message);
    res
      .status(400)
      .json({ message: err.message || "Lỗi hệ thống, vui lòng thử lại" });
  }
};

// Export để orderController.js dùng lại đúng logic tính giảm giá (không gọi lại qua HTTP)
exports.calculateVoucherDiscount = calculateVoucherDiscount;

/**
 * Hàm nội bộ (KHÔNG phải route) — gọi từ trong controllers/orderController.js
 * ngay sau khi tạo Order thành công, để khoá voucher lại không cho dùng nữa.
 *
 * Ví dụ dùng trong orderController.js:
 *   const { markVoucherUsed } = require("./voucherController");
 *   await markVoucherUsed(req.userId, req.body.voucherCode, newOrder._id);
 */
exports.markVoucherUsed = async (userId, code, orderId) => {
  if (!code) return;
  await UserVoucher.findOneAndUpdate(
    { userId, code: code.toUpperCase(), isUsed: false },
    { isUsed: true, usedAt: new Date(), usedInOrderId: orderId },
  );
};
