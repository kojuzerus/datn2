const Promotion = require("../models/promotionModel");
const Voucher = require("../models/Voucher");
const UserVoucher = require("../models/UserVoucher");

// ── Tính tiền giảm chung cho cả 2 loại mã ──────────────────────────────────
function tinhTienGiam({ type, value, maxDiscount }, orderTotal) {
  let discount;
  if (type === "percent") {
    discount = Math.floor((orderTotal * value) / 100);
    if (maxDiscount != null) discount = Math.min(discount, maxDiscount);
  } else if (type === "freeship" || type === "none") {
    discount = 0;
  } else {
    discount = value;
  }
  return Math.min(discount, orderTotal);
}

// ── Nhánh 1: mã khuyến mãi thường (bảng Promotion) ─────────────────────────
async function checkPromotion(code, orderTotal) {
  const promo = await Promotion.findOne({ code });
  if (!promo) return null;

  if (promo.status !== "active")
    return { ok: false, message: "Mã giảm giá đã bị vô hiệu hóa" };

  const now = new Date();
  if (now < promo.start_date)
    return { ok: false, message: "Mã giảm giá chưa đến thời gian áp dụng" };
  if (now > promo.end_date)
    return { ok: false, message: "Mã giảm giá đã hết hạn" };

  if (promo.usage_limit != null && promo.used_count >= promo.usage_limit)
    return { ok: false, message: "Mã giảm giá đã hết lượt sử dụng" };

  if (orderTotal < promo.min_order_value)
    return {
      ok: false,
      message: `Đơn hàng tối thiểu ${promo.min_order_value.toLocaleString("vi-VN")}đ mới được áp mã này`,
    };

  const discount = tinhTienGiam(
    {
      type: promo.discount_type,
      value: promo.discount_value,
      maxDiscount: promo.max_discount,
    },
    orderTotal,
  );

  return {
    ok: true,
    discount,
    promo,
    nguon: "promotion",
    thongTin: {
      code: promo.code,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
    },
  };
}

// ── Nhánh 2: mã trúng từ vòng quay (bảng UserVoucher) ──────────────────────
async function checkSpinVoucher(code, orderTotal, userId) {
  const voucher = await Voucher.findOne({ code });
  if (!voucher) return null;

  if (!userId)
    return { ok: false, message: "Vui lòng đăng nhập để dùng mã vòng quay" };

  const uv = await UserVoucher.findOne({ code, userId });
  if (!uv)
    return { ok: false, message: "Bạn chưa trúng mã này ở vòng quay may mắn" };
  if (uv.isUsed) return { ok: false, message: "Mã này đã được sử dụng" };

  if (voucher.type === "none")
    return { ok: false, message: "Mã này không có giá trị giảm giá" };

  if (voucher.expiredAt && new Date() > voucher.expiredAt)
    return { ok: false, message: "Mã đã hết hạn sử dụng" };

  if (orderTotal < (voucher.minOrderValue || 0))
    return {
      ok: false,
      message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}đ mới được áp mã này`,
    };

  const discount = tinhTienGiam(
    {
      type: voucher.type,
      value: voucher.value,
      maxDiscount: voucher.maxDiscount,
    },
    orderTotal,
  );

  return {
    ok: true,
    discount,
    voucher,
    userVoucher: uv,
    nguon: "spin",
    thongTin: {
      code: voucher.code,
      description: voucher.label,
      discount_type: voucher.type,
      discount_value: voucher.value,
      isFreeship: voucher.type === "freeship",
    },
  };
}

// ── Hàm chính: thử Promotion trước, rồi tới voucher vòng quay ───────────────
async function checkPromo(code, orderTotal, userId = null) {
  const ma = String(code).trim().toUpperCase();

  const kqPromotion = await checkPromotion(ma, orderTotal);
  if (kqPromotion) return kqPromotion;

  const kqSpin = await checkSpinVoucher(ma, orderTotal, userId);
  if (kqSpin) return kqSpin;

  return { ok: false, message: "Mã giảm giá không tồn tại" };
}
exports.checkPromo = checkPromo;

// ── [POST] /api/promotions/validate — khách áp mã ở trang thanh toán ────────
exports.validateCode = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập mã giảm giá" });

    const total = Number(orderTotal) || 0;
    const userId = req.user?._id || req.user?.id || null;

    const result = await checkPromo(code, total, userId);
    if (!result.ok)
      return res.json({ success: false, message: result.message });

    res.json({
      success: true,
      data: { ...result.thongTin, discount: result.discount },
    });
  } catch (err) {
    console.error("[validateCode]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/promotions/available — public: mã còn hiệu lực cho khách ─────
exports.getAvailable = async (req, res) => {
  try {
    const now = new Date();
    const promos = await Promotion.find({
      status: "active",
      start_date: { $lte: now },
      end_date: { $gte: now },
    })
      .sort({ min_order_value: 1 })
      .select(
        "code description discount_type discount_value max_discount min_order_value usage_limit used_count end_date",
      )
      .lean();

    const data = promos
      .filter((p) => p.usage_limit == null || p.used_count < p.usage_limit)
      .slice(0, 10)
      .map(({ usage_limit, used_count, ...rest }) => rest);

    res.json({ success: true, data });
  } catch (err) {
    console.error("[promotions getAvailable]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/promotions — admin: danh sách với tìm kiếm/lọc/phân trang ────
exports.getAll = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(search.trim(), "i");
      filter.$or = [{ code: re }, { description: re }];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const [total, promotions] = await Promise.all([
      Promotion.countDocuments(filter),
      Promotion.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      data: promotions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err) {
    console.error("[promotions getAll]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── Helper: validate payload thêm/sửa ───────────────────────────────────────
function validatePayload(body) {
  const { code, discount_type, discount_value, start_date, end_date } = body;
  if (!code?.trim()) return "Vui lòng nhập mã giảm giá";
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(code.trim()))
    return "Mã chỉ gồm chữ, số, gạch ngang (3-20 ký tự)";
  if (!["percent", "fixed"].includes(discount_type))
    return "Loại giảm giá không hợp lệ";
  const value = Number(discount_value);
  if (!value || value <= 0) return "Giá trị giảm phải lớn hơn 0";
  if (discount_type === "percent" && value > 100)
    return "Giảm theo % không được vượt quá 100";
  if (!start_date || !end_date) return "Vui lòng chọn thời gian áp dụng";
  if (new Date(end_date) <= new Date(start_date))
    return "Ngày kết thúc phải sau ngày bắt đầu";
  return null;
}

// ── [POST] /api/promotions — admin: tạo mã ──────────────────────────────────
exports.create = async (req, res) => {
  try {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const code = req.body.code.trim().toUpperCase();
    const existed = await Promotion.findOne({ code });
    if (existed)
      return res
        .status(400)
        .json({ success: false, message: "Mã giảm giá này đã tồn tại" });

    const promo = await Promotion.create({
      code,
      description: req.body.description || "",
      discount_type: req.body.discount_type,
      discount_value: Number(req.body.discount_value),
      max_discount: req.body.max_discount
        ? Number(req.body.max_discount)
        : null,
      min_order_value: Number(req.body.min_order_value) || 0,
      usage_limit: req.body.usage_limit ? Number(req.body.usage_limit) : null,
      start_date: new Date(req.body.start_date),
      end_date: new Date(req.body.end_date),
      status: req.body.status === "inactive" ? "inactive" : "active",
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Tạo mã giảm giá thành công",
        data: promo,
      });
  } catch (err) {
    console.error("[promotions create]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [PUT] /api/promotions/:id — admin: cập nhật ─────────────────────────────
exports.update = async (req, res) => {
  try {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const code = req.body.code.trim().toUpperCase();
    const existed = await Promotion.findOne({
      code,
      _id: { $ne: req.params.id },
    });
    if (existed)
      return res
        .status(400)
        .json({ success: false, message: "Mã giảm giá này đã tồn tại" });

    const promo = await Promotion.findByIdAndUpdate(
      req.params.id,
      {
        code,
        description: req.body.description || "",
        discount_type: req.body.discount_type,
        discount_value: Number(req.body.discount_value),
        max_discount: req.body.max_discount
          ? Number(req.body.max_discount)
          : null,
        min_order_value: Number(req.body.min_order_value) || 0,
        usage_limit: req.body.usage_limit ? Number(req.body.usage_limit) : null,
        start_date: new Date(req.body.start_date),
        end_date: new Date(req.body.end_date),
        status: req.body.status === "inactive" ? "inactive" : "active",
      },
      { new: true },
    );
    if (!promo)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã giảm giá" });

    res.json({
      success: true,
      message: "Cập nhật mã giảm giá thành công",
      data: promo,
    });
  } catch (err) {
    console.error("[promotions update]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [DELETE] /api/promotions/:id — admin: xóa ───────────────────────────────
exports.remove = async (req, res) => {
  try {
    const promo = await Promotion.findByIdAndDelete(req.params.id);
    if (!promo)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã giảm giá" });
    res.json({ success: true, message: "Đã xóa mã giảm giá" });
  } catch (err) {
    console.error("[promotions remove]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
