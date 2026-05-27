const Product = require("../models/productModel");

// ── Helper: lấy giá hiển thị từ variants ─────────────────────────────────
function getDisplayPrice(variants = []) {
  if (!variants.length) return { price: 0, sale_price: null, discount_pct: 0 };

  // Ưu tiên variant có sale_price thấp nhất
  const withSale = variants.filter((v) => v.sale_price != null);
  const base = withSale.length
    ? withSale.reduce((a, b) => (a.sale_price < b.sale_price ? a : b))
    : variants.reduce((a, b) => (a.price < b.price ? a : b));

  const price      = base.price;
  const sale_price = base.sale_price ?? null;
  const discount_pct = sale_price
    ? Math.round(((price - sale_price) / price) * 100)
    : 0;

  return { price, sale_price, discount_pct };
}

// ── Helper: chuẩn hóa output gửi về FE ───────────────────────────────────
function formatProduct(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  const { price, sale_price, discount_pct } = getDisplayPrice(p.variants);

  return {
    id:            p.product_id,
    ten:           p.product_name,
    slug:          p.slug,
    thuongHieu:    p.brand_name || "",
    thumbnail:     p.thumbnail || "",
    moTa:          p.short_description || "",
    gia:           price,
    giaSale:       sale_price,
    giamGia:       discount_pct,
    danhGia:       p.avg_rating || 0,
    luotDanhGia:   p.review_count || 0,
    luotBan:       p.total_sold || 0,
    badge:         p.badge || "",
    categoryName:  p.category_name || "",
    warranty:      p.warranty || "",
  };
}

// ── [GET] /api/products/featured ─────────────────────────────────────────
// Sản phẩm nổi bật: active, avg_rating cao, có thể có badge
exports.getFeatured = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const products = await Product.find({ status: "active" })
      .sort({ avg_rating: -1, total_sold: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: products.map((p) => {
        const { price, sale_price, discount_pct } = getDisplayPrice(p.variants);
        return {
          id:           p.product_id,
          ten:          p.product_name,
          slug:         p.slug,
          thuongHieu:   p.brand_name || "",
          thumbnail:    p.thumbnail || "",
          moTa:         p.short_description || "",
          gia:          price,
          giaSale:      sale_price,
          giamGia:      discount_pct,
          danhGia:      p.avg_rating || 0,
          luotDanhGia:  p.review_count || 0,
          badge:        p.badge || "",
        };
      }),
    });
  } catch (err) {
    console.error("[getFeatured]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [GET] /api/products/best-selling ─────────────────────────────────────
// Sản phẩm bán chạy: sắp xếp theo total_sold giảm dần
exports.getBestSelling = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    const products = await Product.find({ status: "active" })
      .sort({ total_sold: -1, avg_rating: -1 })
      .limit(limit)
      .lean();

    const fmt = (n) =>
      n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);

    res.json({
      success: true,
      data: products.map((p, i) => {
        const { price, sale_price, discount_pct } = getDisplayPrice(p.variants);
        return {
          id:          p.product_id,
          ten:         p.product_name,
          slug:        p.slug,
          thuongHieu:  p.brand_name || "",
          thumbnail:   p.thumbnail || "",
          moTa:        p.short_description || "",
          gia:         price,
          giaSale:     sale_price,
          giamGia:     discount_pct,
          danhGia:     p.avg_rating || 0,
          luotBan:     fmt(p.total_sold || 0),
          rank:        i + 1,
        };
      }),
    });
  } catch (err) {
    console.error("[getBestSelling]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [GET] /api/products ───────────────────────────────────────────────────
// Danh sách sản phẩm có filter / phân trang
exports.getAll = async (req, res) => {
  try {
    const {
      category_id,
      brand_id,
      search,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { status: "active" };
    if (category_id) filter.category_id = parseInt(category_id);
    if (brand_id)    filter.brand_id    = parseInt(brand_id);
    if (search)      filter.product_name = { $regex: search, $options: "i" };

    const sortMap = {
      newest:    { created_at: -1 },
      price_asc: { "variants.0.price": 1 },
      price_desc:{ "variants.0.price": -1 },
      rating:    { avg_rating: -1 },
      sold:      { total_sold: -1 },
    };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: products.map((p) => {
        const { price, sale_price, discount_pct } = getDisplayPrice(p.variants);
        return {
          id:          p.product_id,
          ten:         p.product_name,
          slug:        p.slug,
          thuongHieu:  p.brand_name || "",
          thumbnail:   p.thumbnail || "",
          moTa:        p.short_description || "",
          gia:         price,
          giaSale:     sale_price,
          giamGia:     discount_pct,
          danhGia:     p.avg_rating || 0,
          luotBan:     p.total_sold || 0,
          badge:       p.badge || "",
        };
      }),
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("[getAll]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [GET] /api/products/:slug ─────────────────────────────────────────────
exports.getBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: "active" }).lean();
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    res.json({ success: true, data: formatProduct(product) });
  } catch (err) {
    console.error("[getBySlug]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};