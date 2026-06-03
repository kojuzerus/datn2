// controllers/productController.js
const Product = require("../models/productModel");
const Variant = require("../models/variantModel");
const ProductImage = require("../models/productImageModel");

// ── Helper: lấy giá hiển thị từ variants ─────────────────────────────────
function getDisplayPrice(variants = []) {
  if (!variants.length) return { price: 0, sale_price: null, discount_pct: 0 };

  const withSale = variants.filter((v) => v.sale_price != null);
  const base = withSale.length
    ? withSale.reduce((a, b) => (a.sale_price < b.sale_price ? a : b))
    : variants.reduce((a, b) => (a.price < b.price ? a : b));

  const price        = base.price;
  const sale_price   = base.sale_price ?? null;
  const discount_pct = sale_price
    ? Math.round(((price - sale_price) / price) * 100)
    : 0;

  return { price, sale_price, discount_pct };
}

// ── Helper: fetch variants cho nhiều product cùng lúc ────────────────────
// Tránh N+1 query: chỉ query Variant 1 lần cho toàn bộ danh sách
async function attachVariants(products) {
  const ids = products.map((p) => p.product_id);
  const variants = await Variant.find({ product_id: { $in: ids } }).lean();

  // Group variants theo product_id
  const variantMap = {};
  for (const v of variants) {
    if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
    variantMap[v.product_id].push(v);
  }

  return products.map((p) => ({
    ...p,
    variants: variantMap[p.product_id] || [],
  }));
}

async function attachProductImages(products) {
  const variantIds = products.flatMap((p) => (p.variants || []).map((v) => v.variant_id));
  if (!variantIds.length) return products;

  const images = await ProductImage.find({ variant_id: { $in: variantIds } })
    .sort({ sort_order: 1 })
    .lean();

  const imageMap = {};
  for (const image of images) {
    if (!imageMap[image.variant_id]) imageMap[image.variant_id] = [];
    imageMap[image.variant_id].push(image);
  }

  return products.map((p) => {
    const productImages = [];
    for (const v of p.variants || []) {
      productImages.push(...(imageMap[v.variant_id] || []));
    }
    return {
      ...p,
      product_images: productImages,
    };
  });
}

const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  let normalized = url.replace(/^public\//, "");
  if (!normalized.startsWith("images/") && !normalized.startsWith("/")) {
    normalized = `images/${normalized}`;
  }
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;

  return `${BASE_URL}${normalized}`;
}

function getPrimaryImage(p) {
  const firstImage = p.product_images?.[0]?.image_url;
  if (firstImage) return normalizeImageUrl(firstImage);
  return normalizeImageUrl(p.thumbnail || "");
}

// ── Helper: format output gửi FE ─────────────────────────────────────────
function formatProduct(p) {
  const { price, sale_price, discount_pct } = getDisplayPrice(p.variants);
  return {
    id:           p.product_id,
    ten:          p.product_name,
    slug:         p.slug,
    thuongHieu:   p.brand_name || "",
    thumbnail:    getPrimaryImage(p),
    images:       (p.product_images || []).map((img) => normalizeImageUrl(img.image_url)),
    moTa:         p.short_description || "",
    gia:          price,
    giaSale:      sale_price,
    giamGia:      discount_pct,
    danhGia:      p.avg_rating || 0,
    luotDanhGia:  p.review_count || 0,
    luotBan:      p.total_sold || 0,
    badge:        p.badge || "",
    categoryName: p.category_name || "",
    warranty:     p.warranty || "",
    variants:     p.variants,
  };
}

// ── [GET] /api/products/featured ─────────────────────────────────────────
exports.getFeatured = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    let products = await Product.find({ status: "active" })
      .sort({ avg_rating: -1, total_sold: -1 })
      .limit(limit)
      .lean();

    products = await attachVariants(products);  // ← join variants
    products = await attachProductImages(products); // ← join product_images

    res.json({
      success: true,
      data: products.map(formatProduct),
    });
  } catch (err) {
    console.error("[getFeatured]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [GET] /api/products/best-selling ─────────────────────────────────────
exports.getBestSelling = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const fmt   = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n));

    let products = await Product.find({ status: "active" })
      .sort({ total_sold: -1, avg_rating: -1 })
      .limit(limit)
      .lean();

    products = await attachVariants(products);  // ← join variants
    products = await attachProductImages(products); // ← join product_images

    res.json({
      success: true,
      data: products.map((p, i) => ({
        ...formatProduct(p),
        luotBan: fmt(p.total_sold || 0),
        rank:    i + 1,
      })),
    });
  } catch (err) {
    console.error("[getBestSelling]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [GET] /api/products ───────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { category_id, brand_id, search, sort = "newest", page = 1, limit = 12 } = req.query;

    const filter = { status: "active" };
    if (category_id) filter.category_id = parseInt(category_id);
    if (brand_id)    filter.brand_id    = parseInt(brand_id);
    if (search)      filter.product_name = { $regex: search, $options: "i" };

    const sortMap = {
      newest:     { created_at: -1 },
      rating:     { avg_rating: -1 },
      sold:       { total_sold: -1 },
      // price_asc / price_desc: sort sau khi join vì giá nằm ở variants
    };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(filter);

    let products = await Product.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    products = await attachVariants(products);  // ← join variants
    products = await attachProductImages(products); // ← join product_images

    // Sort theo giá sau khi đã có variants
    if (sort === "price_asc") {
      products.sort((a, b) => {
        const pa = getDisplayPrice(a.variants).sale_price ?? getDisplayPrice(a.variants).price;
        const pb = getDisplayPrice(b.variants).sale_price ?? getDisplayPrice(b.variants).price;
        return pa - pb;
      });
    } else if (sort === "price_desc") {
      products.sort((a, b) => {
        const pa = getDisplayPrice(a.variants).sale_price ?? getDisplayPrice(a.variants).price;
        const pb = getDisplayPrice(b.variants).sale_price ?? getDisplayPrice(b.variants).price;
        return pb - pa;
      });
    }

    res.json({
      success: true,
      data: products.map(formatProduct),
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
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
    if (!product)
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    // Join variants cho 1 sản phẩm
    const variants = await Variant.find({ product_id: product.product_id }).lean();
    product.variants = variants;
    product = (await attachProductImages([product]))[0];

    res.json({ success: true, data: formatProduct(product) });
  } catch (err) {
    console.error("[getBySlug]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};