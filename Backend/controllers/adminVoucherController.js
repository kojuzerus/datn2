const Voucher = require("../models/Voucher");
const UserVoucher = require("../models/UserVoucher");

// ── Helper: kiểm tra dữ liệu thêm/sửa ô phần thưởng ────────────────────────
function validatePayload(body) {
  const { code, label, type, value } = body;

  if (!code?.trim()) return "Vui lòng nhập mã voucher";
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(code.trim()))
    return "Mã chỉ gồm chữ, số, gạch ngang (3-20 ký tự)";
  if (!label?.trim()) return "Vui lòng nhập nhãn hiển thị trên vòng quay";
  if (!["percent", "fixed", "freeship", "none"].includes(type))
    return "Loại phần thưởng không hợp lệ";

  // freeship và none (chúc may mắn) không cần giá trị giảm
  if (type !== "freeship" && type !== "none") {
    const v = Number(value);
    if (!v || v <= 0) return "Giá trị giảm phải lớn hơn 0";
    if (type === "percent" && v > 100)
      return "Giảm theo % không được vượt quá 100";
  }

  const weight = Number(body.weight);
  if (
    body.weight !== undefined &&
    body.weight !== "" &&
    (!weight || weight <= 0)
  )
    return "Tỉ lệ trúng phải lớn hơn 0";

  return null;
}

// Chuẩn hoá dữ liệu từ form về đúng kiểu lưu DB
function buildDoc(body) {
  return {
    code: body.code.trim().toUpperCase(),
    label: body.label.trim(),
    type: body.type,
    value:
      body.type === "freeship" || body.type === "none" ? 0 : Number(body.value),
    minOrderValue: Number(body.minOrderValue) || 0,
    maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
    weight: Number(body.weight) || 1,
    expiredAt: body.expiredAt ? new Date(body.expiredAt) : null,
    isActive: body.isActive === false ? false : true,
  };
}

// ── [GET] /api/admin/vouchers — danh sách ô phần thưởng ────────────────────
exports.getAll = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 }).lean();

    // Đếm số lượt đã trúng / đã dùng cho từng voucher
    const stats = await UserVoucher.aggregate([
      {
        $group: {
          _id: "$voucherId",
          daTrung: { $sum: 1 },
          daDung: { $sum: { $cond: ["$isUsed", 1, 0] } },
        },
      },
    ]);

    const map = {};
    stats.forEach((s) => (map[String(s._id)] = s));

    // Tổng weight để tính tỉ lệ trúng thực tế (%) — chỉ tính ô đang bật
    const tongWeight = vouchers
      .filter((v) => v.isActive)
      .reduce((s, v) => s + (v.weight || 1), 0);

    const data = vouchers.map((v) => {
      const st = map[String(v._id)] || { daTrung: 0, daDung: 0 };
      return {
        ...v,
        daTrung: st.daTrung,
        daDung: st.daDung,
        tiLeTrung:
          v.isActive && tongWeight > 0
            ? Math.round(((v.weight || 1) / tongWeight) * 1000) / 10
            : 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("[adminVoucher getAll]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [POST] /api/admin/vouchers — thêm ô phần thưởng ────────────────────────
exports.create = async (req, res) => {
  try {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const code = req.body.code.trim().toUpperCase();
    const existed = await Voucher.findOne({ code });
    if (existed)
      return res
        .status(400)
        .json({ success: false, message: "Mã voucher này đã tồn tại" });

    const voucher = await Voucher.create(buildDoc(req.body));
    res.status(201).json({
      success: true,
      message: "Đã thêm ô phần thưởng",
      data: voucher,
    });
  } catch (err) {
    console.error("[adminVoucher create]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [PUT] /api/admin/vouchers/:id — sửa ô phần thưởng ──────────────────────
exports.update = async (req, res) => {
  try {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const code = req.body.code.trim().toUpperCase();
    const existed = await Voucher.findOne({
      code,
      _id: { $ne: req.params.id },
    });
    if (existed)
      return res
        .status(400)
        .json({ success: false, message: "Mã voucher này đã tồn tại" });

    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      buildDoc(req.body),
      { new: true },
    );
    if (!voucher)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ô phần thưởng" });

    res.json({ success: true, message: "Đã lưu thay đổi", data: voucher });
  } catch (err) {
    console.error("[adminVoucher update]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [PATCH] /api/admin/vouchers/:id/toggle — bật/tắt nhanh ─────────────────
exports.toggleActive = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ô phần thưởng" });

    voucher.isActive = !voucher.isActive;
    await voucher.save();

    res.json({
      success: true,
      message: voucher.isActive
        ? "Đã bật ô phần thưởng"
        : "Đã tắt ô phần thưởng",
      data: voucher,
    });
  } catch (err) {
    console.error("[adminVoucher toggleActive]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [DELETE] /api/admin/vouchers/:id — xoá ô phần thưởng ───────────────────
exports.remove = async (req, res) => {
  try {
    // Đã có khách trúng thì không cho xoá, tránh mất lịch sử — gợi ý tắt thay vì xoá
    const daPhat = await UserVoucher.countDocuments({
      voucherId: req.params.id,
    });
    if (daPhat > 0)
      return res.status(400).json({
        success: false,
        message: `Đã có ${daPhat} khách trúng mã này. Hãy tắt ô thay vì xoá để giữ lịch sử.`,
      });

    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ô phần thưởng" });

    res.json({ success: true, message: "Đã xoá ô phần thưởng" });
  } catch (err) {
    console.error("[adminVoucher remove]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/admin/vouchers/awarded — lịch sử khách trúng mã ─────────────
// Query: ?search=&status=used|unused&page=1&limit=20
exports.getAwarded = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status === "used") filter.isUsed = true;
    if (status === "unused") filter.isUsed = false;
    if (search.trim()) filter.code = new RegExp(search.trim(), "i");

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const [total, list] = await Promise.all([
      UserVoucher.countDocuments(filter),
      UserVoucher.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("userId", "hoTen soDienThoai email")
        .populate("voucherId", "label type value")
        .lean(),
    ]);

    const data = list.map((uv) => ({
      _id: uv._id,
      code: uv.code,
      isUsed: uv.isUsed,
      usedAt: uv.usedAt || null,
      createdAt: uv.createdAt,
      khachHang: uv.userId
        ? {
            hoTen: uv.userId.hoTen,
            soDienThoai: uv.userId.soDienThoai,
            email: uv.userId.email,
          }
        : null,
      phanThuong: uv.voucherId
        ? {
            label: uv.voucherId.label,
            type: uv.voucherId.type,
            value: uv.voucherId.value,
          }
        : null,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err) {
    console.error("[adminVoucher getAwarded]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [DELETE] /api/admin/vouchers/awarded/:id — thu hồi lượt quay của khách ──
// Xoá bản ghi UserVoucher để khách có thể quay lại (dùng khi khách báo lỗi)
exports.resetSpin = async (req, res) => {
  try {
    const uv = await UserVoucher.findById(req.params.id);
    if (!uv)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lượt quay" });
    if (uv.isUsed)
      return res.status(400).json({
        success: false,
        message: "Mã đã được dùng để đặt hàng, không thể thu hồi",
      });

    await uv.deleteOne();
    res.json({ success: true, message: "Đã thu hồi, khách có thể quay lại" });
  } catch (err) {
    console.error("[adminVoucher resetSpin]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
