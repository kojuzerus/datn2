const Promotion = require("../models/promotionModel");

// ── Helper: kiểm tra mã còn hiệu lực với giá trị đơn hàng, trả về số tiền giảm ──
// Trả về { ok: true, discount, promo } hoặc { ok: false, message }
async function checkPromo(code, orderTotal) {
  const promo = await Promotion.findOne({ code: String(code).trim().toUpperCase() });
  if (!promo)                          return { ok: false, message: "Mã giảm giá không tồn tại" };
  if (promo.status !== "active")       return { ok: false, message: "Mã giảm giá đã bị vô hiệu hóa" };

  const now = new Date();
  if (now < promo.start_date)          return { ok: false, message: "Mã giảm giá chưa đến thời gian áp dụng" };
  if (now > promo.end_date)            return { ok: false, message: "Mã giảm giá đã hết hạn" };

  if (promo.usage_limit != null && promo.used_count >= promo.usage_limit)
    return { ok: false, message: "Mã giảm giá đã hết lượt sử dụng" };

  if (orderTotal < promo.min_order_value)
    return {
      ok: false,
      message: `Đơn hàng tối thiểu ${promo.min_order_value.toLocaleString("vi-VN")}đ mới được áp mã này`,
    };

  let discount;
  if (promo.discount_type === "percent") {
    discount = Math.floor((orderTotal * promo.discount_value) / 100);
    if (promo.max_discount != null) discount = Math.min(discount, promo.max_discount);
  } else {
    discount = promo.discount_value;
  }
  discount = Math.min(discount, orderTotal); // không giảm quá giá trị đơn

  return { ok: true, discount, promo };
}
exports.checkPromo = checkPromo;

// ── [POST] /api/promotions/validate — khách áp mã ở trang thanh toán ────────
exports.validateCode = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code?.trim())
      return res.status(400).json({ success: false, message: "Vui lòng nhập mã giảm giá" });

    const total = Number(orderTotal) || 0;
    const result = await checkPromo(code, total);
    if (!result.ok) return res.json({ success: false, message: result.message });

    res.json({
      success: true,
      data: {
        code:           result.promo.code,
        description:    result.promo.description,
        discount_type:  result.promo.discount_type,
        discount_value: result.promo.discount_value,
        discount:       result.discount,
      },
    });
  } catch (err) {
    console.error("[validateCode]", err);
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

    const pageNum  = parseInt(page) || 1;
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
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.max(1, Math.ceil(total / limitNum)) },
    });
  } catch (err) {
    console.error("[promotions getAll]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── Helper: validate payload thêm/sửa ───────────────────────────────────────
function validatePayload(body) {
  const { code, discount_type, discount_value, start_date, end_date } = body;
  if (!code?.trim())                                    return "Vui lòng nhập mã giảm giá";
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(code.trim()))       return "Mã chỉ gồm chữ, số, gạch ngang (3-20 ký tự)";
  if (!["percent", "fixed"].includes(discount_type))    return "Loại giảm giá không hợp lệ";
  const value = Number(discount_value);
  if (!value || value <= 0)                             return "Giá trị giảm phải lớn hơn 0";
  if (discount_type === "percent" && value > 100)       return "Giảm theo % không được vượt quá 100";
  if (!start_date || !end_date)                         return "Vui lòng chọn thời gian áp dụng";
  if (new Date(end_date) <= new Date(start_date))       return "Ngày kết thúc phải sau ngày bắt đầu";
  return null;
}

// ── [POST] /api/promotions — admin: tạo mã ──────────────────────────────────
exports.create = async (req, res) => {
  try {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const code = req.body.code.trim().toUpperCase();
    const existed = await Promotion.findOne({ code });
    if (existed) return res.status(400).json({ success: false, message: "Mã giảm giá này đã tồn tại" });

    const promo = await Promotion.create({
      code,
      description:     req.body.description || "",
      discount_type:   req.body.discount_type,
      discount_value:  Number(req.body.discount_value),
      max_discount:    req.body.max_discount ? Number(req.body.max_discount) : null,
      min_order_value: Number(req.body.min_order_value) || 0,
      usage_limit:     req.body.usage_limit ? Number(req.body.usage_limit) : null,
      start_date:      new Date(req.body.start_date),
      end_date:        new Date(req.body.end_date),
      status:          req.body.status === "inactive" ? "inactive" : "active",
    });

    res.status(201).json({ success: true, message: "Tạo mã giảm giá thành công", data: promo });
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
    const existed = await Promotion.findOne({ code, _id: { $ne: req.params.id } });
    if (existed) return res.status(400).json({ success: false, message: "Mã giảm giá này đã tồn tại" });

    const promo = await Promotion.findByIdAndUpdate(
      req.params.id,
      {
        code,
        description:     req.body.description || "",
        discount_type:   req.body.discount_type,
        discount_value:  Number(req.body.discount_value),
        max_discount:    req.body.max_discount ? Number(req.body.max_discount) : null,
        min_order_value: Number(req.body.min_order_value) || 0,
        usage_limit:     req.body.usage_limit ? Number(req.body.usage_limit) : null,
        start_date:      new Date(req.body.start_date),
        end_date:        new Date(req.body.end_date),
        status:          req.body.status === "inactive" ? "inactive" : "active",
      },
      { new: true }
    );
    if (!promo) return res.status(404).json({ success: false, message: "Không tìm thấy mã giảm giá" });

    res.json({ success: true, message: "Cập nhật mã giảm giá thành công", data: promo });
  } catch (err) {
    console.error("[promotions update]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [DELETE] /api/promotions/:id — admin: xóa ───────────────────────────────
exports.remove = async (req, res) => {
  try {
    const promo = await Promotion.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: "Không tìm thấy mã giảm giá" });
    res.json({ success: true, message: "Đã xóa mã giảm giá" });
  } catch (err) {
    console.error("[promotions remove]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
