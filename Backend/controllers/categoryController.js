const Category     = require("../models/categoryModel");
const Brand        = require("../models/brandModel");
const Product      = require("../models/productModel");
const ProductImage = require("../models/productImageModel");

const API_BASE = process.env.API_BASE_URL || "http://localhost:5000";

function normThumb(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    // Optimize CellphoneS CDN
    const m = url.match(/^https?:\/\/cdn2\.cellphones\.com\.vn\/x\/(media\/catalog\/product\/.+)$/);
    if (m) return `https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/${m[1].split("?")[0]}`;
    return url;
  }
  let n = url.replace(/^public\//, "");
  if (!n.startsWith("images/") && !n.startsWith("/")) n = `images/${n}`;
  if (!n.startsWith("/")) n = `/${n}`;
  return `${API_BASE}${n}`;
}

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
    if (excludeId) query.category_id = { $ne: excludeId };
    const exists = await Category.findOne(query).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

async function nextCategoryId() {
  const last = await Category.findOne().sort({ category_id: -1 }).select("category_id").lean();
  return (last?.category_id ?? 0) + 1;
}

exports.getAll = async (req, res) => {
  try {
    const filter = req.query.status === "all" ? {} : { status: "active" };
    const categories = await Category.find(filter).sort({ category_id: 1 }).lean();

    // Lấy ảnh đại diện cho mỗi danh mục từ sản phẩm thực
    const catNames = categories.map((c) => c.category_name);

    // Bước 1: lấy 1 product + variant đầu tiên mỗi danh mục
    const catProducts = await Product.aggregate([
      { $match: { status: "active", category_name: { $in: catNames } } },
      { $addFields: { first_variant_id: { $arrayElemAt: ["$variants.variant_id", 0] } } },
      { $sort: { product_id: 1 } },
      { $group: {
        _id: "$category_name",
        thumbnail: { $first: "$thumbnail" },
        first_variant_id: { $first: "$first_variant_id" },
      }},
    ]);

    // Bước 2: lấy ảnh từ ProductImage cho variants không có thumbnail
    const variantIds = catProducts.map((p) => p.first_variant_id).filter(Boolean);
    const images = await ProductImage.find({ variant_id: { $in: variantIds } })
      .sort({ sort_order: 1 })
      .lean();
    const variantImageMap = {};
    for (const img of images) {
      if (!variantImageMap[img.variant_id]) variantImageMap[img.variant_id] = img.image_url;
    }

    // Bước 3: build map category_name → thumbnail URL
    const thumbMap = {};
    for (const p of catProducts) {
      const url = (p.thumbnail && p.thumbnail !== "")
        ? normThumb(p.thumbnail)
        : normThumb(variantImageMap[p.first_variant_id] || "");
      if (url) thumbMap[p._id] = url;
    }

    if (req.query.withBrandCount === "true") {
      const brands = await Brand.find().select("category_ids").lean();
      const countMap = {};
      brands.forEach((b) => {
        (b.category_ids || []).forEach((cid) => { countMap[cid] = (countMap[cid] || 0) + 1; });
      });
      const data = categories.map((c) => ({
        ...c,
        brandCount: countMap[c.category_id] || 0,
        product_thumbnail: thumbMap[c.category_name] || "",
      }));
      return res.json({ success: true, data });
    }

    const data = categories.map((c) => ({
      ...c,
      product_thumbnail: thumbMap[c.category_name] || "",
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error("[getAllCategories]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, status: "active" }).lean();
    if (!category) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
    }

    res.json({ success: true, data: category });
  } catch (err) {
    console.error("[getCategoryBySlug]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [POST] /api/categories (admin) ──────────────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const { category_name, description = "", image_url = "", status = "active" } = req.body;
    if (!category_name?.trim())
      return res.status(400).json({ success: false, message: "Tên danh mục không được để trống" });

    const category_id = await nextCategoryId();
    const slug = await uniqueSlug(toSlug(category_name));

    const category = await Category.create({
      category_id, category_name: category_name.trim(), slug, description, image_url, status,
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error("[createCategory]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [PUT] /api/categories/:id (admin) ───────────────────────────────────────
exports.updateCategory = async (req, res) => {
  try {
    const category_id = parseInt(req.params.id);
    const existing = await Category.findOne({ category_id }).lean();
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });

    const { category_name, description, image_url, status } = req.body;
    const newName = category_name?.trim() || existing.category_name;
    const slug = category_name?.trim()
      ? await uniqueSlug(toSlug(newName), category_id)
      : existing.slug;

    const updated = await Category.findOneAndUpdate(
      { category_id },
      {
        category_name: newName,
        slug,
        description: description ?? existing.description,
        image_url: image_url ?? existing.image_url,
        status: status ?? existing.status,
      },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[updateCategory]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [DELETE] /api/categories/:id (admin) ────────────────────────────────────
exports.deleteCategory = async (req, res) => {
  try {
    const category_id = parseInt(req.params.id);
    const existing = await Category.findOne({ category_id }).lean();
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });

    await Category.deleteOne({ category_id });
    await Brand.updateMany({ category_ids: category_id }, { $pull: { category_ids: category_id } });

    res.json({ success: true, message: "Đã xoá danh mục thành công" });
  } catch (err) {
    console.error("[deleteCategory]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};
