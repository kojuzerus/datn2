const FlashSale = require("../models/flashSaleModel");
const Variant   = require("../models/variantModel");
const Product   = require("../models/productModel");

function parseVietnamDateTime(value) {
  if (!value) return null;

  // datetime-local gửi từ input HTML có dạng "YYYY-MM-DDTHH:mm".
  // Nếu không gắn timezone, JS sẽ parse theo giờ của server (thường UTC),
  // dẫn đến lệch múi giờ so với giờ admin chọn ở Việt Nam (+07:00).
  const isoLike = `${value}:00+07:00`;
  const date = new Date(isoLike);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ── Helper: gắn thông tin sản phẩm/biến thể vào danh sách flash sale ───────
async function enrichFlashSales(flashSales) {
  const variantIds = flashSales.map((f) => String(f.variant_id));
  const variants = await Variant.find({ _id: { $in: variantIds } }).lean();
  const variantMap = Object.fromEntries(variants.map((v) => [String(v._id), v]));

  const productIds = [...new Set(variants.map((v) => v.product_id))];
  const products = await Product.find({ product_id: { $in: productIds } })
    .select("product_id product_name thumbnail slug specification")
    .lean();
  const productMap = Object.fromEntries(products.map((p) => [p.product_id, p]));

  return flashSales.map((f) => {
    const variant = variantMap[String(f.variant_id)] || null;
    const product = variant ? productMap[variant.product_id] || null : null;
    return {
      ...f,
      sold_quantity: f.sold_quantity ?? Math.max(0, f.quantity - f.remaining_quantity),
      variant: variant
        ? {
            _id: variant._id,
            color: variant.color,
            price: variant.price,
            sku: variant.sku,
            stock_quantity: variant.stock_quantity,
          }
        : null,
      product: product
        ? {
            product_id: product.product_id,
            product_name: product.product_name,
            thumbnail: product.thumbnail,
            slug: product.slug,
            specification: product.specification || [],
          }
        : null,
    };
  });
}

// ── [GET] /api/flash-sales/active — public: các đợt đang diễn ra ───────────
exports.getActive = async (req, res) => {
  try {
    const now = new Date();
    const flashSales = await FlashSale.find({
      status: "active",
      start_time: { $lte: now },
      end_time: { $gte: now },
      remaining_quantity: { $gt: 0 },
    })
      .sort({ end_time: 1 })
      .lean();

    const data = await enrichFlashSales(flashSales);
    res.json({ success: true, data });
  } catch (err) {
    console.error("[flashSale getActive]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/flash-sales/upcoming — public: các đợt sắp mở (chưa tới giờ) ─
// Cho phép FE hiển thị trước sản phẩm của các ngày sắp tới (xem trước, chưa mua được).
exports.getUpcoming = async (req, res) => {
  try {
    const now = new Date();
    const days = Math.min(Math.max(parseInt(req.query.days) || 6, 1), 14);
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const flashSales = await FlashSale.find({
      status: "active",
      start_time: { $gt: now, $lte: until },
    })
      .sort({ start_time: 1 })
      .lean();

    const data = await enrichFlashSales(flashSales);
    res.json({ success: true, data });
  } catch (err) {
    console.error("[flashSale getUpcoming]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/flash-sales/variant-options — admin: tìm biến thể để chọn ───
exports.searchVariantOptions = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const productFilter = q ? { product_name: new RegExp(q, "i") } : {};

    const products = await Product.find(productFilter)
      .select("product_id product_name thumbnail")
      .limit(15)
      .lean();
    if (!products.length) return res.json({ success: true, data: [] });

    const productIds = products.map((p) => p.product_id);
    const productMap = Object.fromEntries(products.map((p) => [p.product_id, p]));

    const variants = await Variant.find({ product_id: { $in: productIds } })
      .limit(50)
      .lean();

    const data = variants.map((v) => {
      const product = productMap[v.product_id];
      return {
        _id: v._id,
        product_name: product?.product_name || "",
        thumbnail: product?.thumbnail || "",
        color: v.color,
        price: v.price,
        sku: v.sku,
        stock_quantity: v.stock_quantity,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("[flashSale searchVariantOptions]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [GET] /api/flash-sales — admin: danh sách với tìm kiếm/lọc/phân trang ──
exports.getAll = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.name = new RegExp(search.trim(), "i");

    const pageNum  = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const [total, flashSales] = await Promise.all([
      FlashSale.countDocuments(filter),
      FlashSale.find(filter)
        .sort({ created_at: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    const data = await enrichFlashSales(flashSales);

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
    console.error("[flashSale getAll]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── Helper: validate payload thêm/sửa ───────────────────────────────────────
function validatePayload(body) {
  const { name, variant_id, sale_price, quantity, start_time, end_time } = body;
  if (!name?.trim()) return "Vui lòng nhập tên đợt flash sale";
  if (!variant_id) return "Vui lòng chọn sản phẩm/biến thể";
  const price = Number(sale_price);
  if (!price || price <= 0) return "Giá flash sale phải lớn hơn 0";
  const qty = Number(quantity);
  if (!qty || qty <= 0) return "Số lượng phải lớn hơn 0";
  if (!start_time || !end_time) return "Vui lòng chọn thời gian diễn ra";

  const startDate = parseVietnamDateTime(start_time);
  const endDate = parseVietnamDateTime(end_time);
  if (!startDate || !endDate) return "Thời gian không hợp lệ";
  if (endDate <= startDate) return "Thời gian kết thúc phải sau thời gian bắt đầu";
  return null;
}

// ── [POST] /api/flash-sales — admin: tạo đợt flash sale ─────────────────────
exports.create = async (req, res) => {
  try {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const variant = await Variant.findById(req.body.variant_id).lean();
    if (!variant)
      return res.status(400).json({ success: false, message: "Biến thể sản phẩm không tồn tại" });

    const salePrice = Number(req.body.sale_price);
    if (salePrice >= variant.price)
      return res.status(400).json({ success: false, message: "Giá flash sale phải thấp hơn giá gốc" });

    const quantity = Number(req.body.quantity);
    const startDate = parseVietnamDateTime(req.body.start_time);
    const endDate = parseVietnamDateTime(req.body.end_time);
    if (!startDate || !endDate)
      return res.status(400).json({ success: false, message: "Thời gian không hợp lệ" });

    const flashSale = await FlashSale.create({
      name:               req.body.name.trim(),
      variant_id:         req.body.variant_id,
      sale_price:         salePrice,
      quantity,
      remaining_quantity: quantity,
      start_time:         startDate,
      end_time:           endDate,
      status:             req.body.status === "inactive" ? "inactive" : "active",
    });

    res.status(201).json({ success: true, message: "Tạo đợt flash sale thành công", data: flashSale });
  } catch (err) {
    console.error("[flashSale create]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [PUT] /api/flash-sales/:id — admin: cập nhật ────────────────────────────
exports.update = async (req, res) => {
  try {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const variant = await Variant.findById(req.body.variant_id).lean();
    if (!variant)
      return res.status(400).json({ success: false, message: "Biến thể sản phẩm không tồn tại" });

    const salePrice = Number(req.body.sale_price);
    if (salePrice >= variant.price)
      return res.status(400).json({ success: false, message: "Giá flash sale phải thấp hơn giá gốc" });

    const existing = await FlashSale.findById(req.params.id);
    if (!existing)
      return res.status(404).json({ success: false, message: "Không tìm thấy đợt flash sale" });

    const quantity = Number(req.body.quantity);
    // Giữ nguyên số lượng đã bán khi đổi tổng số lượng
    const sold = existing.quantity - existing.remaining_quantity;
    const remaining = Math.max(0, quantity - sold);

    const startDate = parseVietnamDateTime(req.body.start_time);
    const endDate = parseVietnamDateTime(req.body.end_time);
    if (!startDate || !endDate)
      return res.status(400).json({ success: false, message: "Thời gian không hợp lệ" });

    const flashSale = await FlashSale.findByIdAndUpdate(
      req.params.id,
      {
        name:               req.body.name.trim(),
        variant_id:         req.body.variant_id,
        sale_price:         salePrice,
        quantity,
        remaining_quantity: remaining,
        start_time:         startDate,
        end_time:           endDate,
        status:             req.body.status === "inactive" ? "inactive" : "active",
      },
      { new: true },
    );

    res.json({ success: true, message: "Cập nhật đợt flash sale thành công", data: flashSale });
  } catch (err) {
    console.error("[flashSale update]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── [DELETE] /api/flash-sales/:id — admin: xóa ──────────────────────────────
exports.remove = async (req, res) => {
  try {
    const flashSale = await FlashSale.findByIdAndDelete(req.params.id);
    if (!flashSale)
      return res.status(404).json({ success: false, message: "Không tìm thấy đợt flash sale" });
    res.json({ success: true, message: "Đã xóa đợt flash sale" });
  } catch (err) {
    console.error("[flashSale remove]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
