// controllers/productController.js
const Product      = require("../models/productModel");
const Variant      = require("../models/variantModel");
const ProductImage = require("../models/productImageModel");
const Brand        = require("../models/brandModel");
const Category     = require("../models/categoryModel");

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

// ── Helpers: auto-increment ID ────────────────────────────────────────────
async function nextProductId() {
  const last = await Product.findOne().sort({ product_id: -1 }).select("product_id").lean();
  return (last?.product_id ?? 0) + 1;
}

async function nextVariantId() {
  const last = await Variant.findOne().sort({ variant_id: -1 }).select("variant_id").lean();
  return (last?.variant_id ?? 0) + 1;
}

// ── Helper: slug generator ────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base, excludeId = null) {
  let slug = base;
  let i = 1;
  while (true) {
    const query = { slug };
    if (excludeId) query.product_id = { $ne: excludeId };
    const exists = await Product.findOne(query).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

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
    id:            p.product_id,
    ten:           p.product_name,
    slug:          p.slug,
    thuongHieu:    p.brand_name || "",
    thumbnail:     getPrimaryImage(p),
    images:        (p.product_images || []).map((img) => normalizeImageUrl(img.image_url)),
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
    variants:      p.variants,
    // Admin fields
    sku:           p.sku || "",
    status:        p.status || "active",
    category_id:   p.category_id ?? null,
    brand_id:      p.brand_id ?? null,
    specification: p.specification || [],
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
    const { category_id, brand_id, search, sort = "newest", page = 1, limit = 12, status, category_name, category_slug } = req.query;

    const filter = {};
    if (status === "all")   { /* no filter */ }
    else if (status)        filter.status = status;
    else                    filter.status = "active";

    if (category_id) {
      filter.category_id = parseInt(category_id);
    } else if (category_slug) {
      const cat = await Category.findOne({ slug: category_slug }).lean();
      if (cat) filter.category_id = cat.category_id;
    }
    if (brand_id)      filter.brand_id      = parseInt(brand_id);
    if (category_name) filter.category_name = { $regex: category_name, $options: "i" };
    if (search)        filter.product_name  = { $regex: search, $options: "i" };

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
    let product = await Product.findOne({ slug: req.params.slug, status: "active" }).lean();
    if (!product)
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    const variants = await Variant.find({ product_id: product.product_id }).lean();
    product.variants = variants;
    [product] = await attachProductImages([product]);

    res.json({ success: true, data: formatProduct(product) });
  } catch (err) {
    console.error("[getBySlug]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [POST] /api/products ──────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const {
      product_name, sku = "", category_id, brand_id,
      warranty = "", badge = "", short_description = "",
      thumbnail = "", status = "active", variants = [],
      specification = [],
    } = req.body;

    if (!product_name?.trim())
      return res.status(400).json({ success: false, message: "Tên sản phẩm không được để trống" });

    const product_id = await nextProductId();
    const slugBase   = toSlug(product_name);
    const slug       = await uniqueSlug(`${slugBase}-${product_id}`);

    const [brand, category] = await Promise.all([
      brand_id    ? Brand.findOne({ brand_id: parseInt(brand_id) }).lean()       : null,
      category_id ? Category.findOne({ category_id: parseInt(category_id) }).lean() : null,
    ]);

    // Build embedded + separate variants
    let variantCounter = await nextVariantId();
    const builtVariants = variants.map((v) => ({
      variant_id:     variantCounter++,
      product_id,
      color:          v.color || "",
      price:          Number(v.price) || 0,
      sale_price:     v.sale_price != null && v.sale_price !== "" ? Number(v.sale_price) : null,
      stock_quantity: parseInt(v.stock_quantity) || 0,
      sku:            v.sku || "",
    }));

    const product = await Product.create({
      product_id,
      product_name: product_name.trim(),
      slug,
      sku,
      thumbnail,
      short_description,
      warranty,
      badge,
      status,
      category_id:   category_id ? parseInt(category_id) : null,
      brand_id:      brand_id    ? parseInt(brand_id)    : null,
      brand_name:    brand?.brand_name       || "",
      category_name: category?.category_name || "",
      variants:      builtVariants,
      specification: (specification || []).filter(s => s.label?.trim() || s.value?.trim()),
    });

    // Also persist to separate product_variants collection
    if (builtVariants.length)
      await Variant.insertMany(builtVariants);

    const plain = product.toObject();
    plain.variants = builtVariants;
    res.status(201).json({ success: true, data: formatProduct(plain) });
  } catch (err) {
    console.error("[createProduct]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [PUT] /api/products/:id ───────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const product_id = parseInt(req.params.id);
    const existing   = await Product.findOne({ product_id }).lean();
    if (!existing)
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    const {
      product_name, sku, category_id, brand_id,
      warranty, badge, short_description, thumbnail, status, variants = [],
      specification,
    } = req.body;

    const [brand, category] = await Promise.all([
      brand_id    ? Brand.findOne({ brand_id: parseInt(brand_id) }).lean()       : null,
      category_id ? Category.findOne({ category_id: parseInt(category_id) }).lean() : null,
    ]);

    const newName    = product_name?.trim() || existing.product_name;
    const slugBase   = toSlug(newName);
    const slug       = await uniqueSlug(`${slugBase}-${product_id}`, product_id);

    // Remove old variants from product_variants collection
    await Variant.deleteMany({ product_id });

    let variantCounter = await nextVariantId();
    const builtVariants = variants.map((v) => ({
      variant_id:     variantCounter++,
      product_id,
      color:          v.color || "",
      price:          Number(v.price) || 0,
      sale_price:     v.sale_price != null && v.sale_price !== "" ? Number(v.sale_price) : null,
      stock_quantity: parseInt(v.stock_quantity) || 0,
      sku:            v.sku || "",
    }));

    if (builtVariants.length)
      await Variant.insertMany(builtVariants);

    const updated = await Product.findOneAndUpdate(
      { product_id },
      {
        product_name:  newName,
        slug,
        sku:           sku          ?? existing.sku,
        thumbnail:     thumbnail    ?? existing.thumbnail,
        short_description: short_description ?? existing.short_description,
        warranty:      warranty     ?? existing.warranty,
        badge:         badge        ?? existing.badge,
        status:        status       ?? existing.status,
        category_id:   category_id  ? parseInt(category_id)  : existing.category_id,
        brand_id:      brand_id     ? parseInt(brand_id)     : existing.brand_id,
        brand_name:    brand?.brand_name       || existing.brand_name,
        category_name: category?.category_name || existing.category_name,
        variants:      builtVariants,
        ...(specification !== undefined && {
          specification: specification.filter(s => s.label?.trim() || s.value?.trim()),
        }),
      },
      { new: true }
    ).lean();

    updated.variants = builtVariants;
    res.json({ success: true, data: formatProduct(updated) });
  } catch (err) {
    console.error("[updateProduct]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [DELETE] /api/products/:id ────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const product_id = parseInt(req.params.id);
    const existing   = await Product.findOne({ product_id }).lean();
    if (!existing)
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    await Promise.all([
      Product.deleteOne({ product_id }),
      Variant.deleteMany({ product_id }),
    ]);

    res.json({ success: true, message: "Đã xoá sản phẩm thành công" });
  } catch (err) {
    console.error("[deleteProduct]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};