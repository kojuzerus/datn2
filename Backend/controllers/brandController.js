const Brand = require("../models/brandModel");
const Category = require("../models/categoryModel");

async function nextBrandId() {
  const last = await Brand.findOne().sort({ brand_id: -1 }).select("brand_id").lean();
  return (last?.brand_id ?? 0) + 1;
}

exports.getAll = async (req, res) => {
  try {
    const { category_slug, status } = req.query;

    if (category_slug) {
      const category = await Category.findOne({ slug: category_slug, status: "active" }).lean();
      if (!category) {
        return res.json({ success: true, data: [] });
      }

      const relatedCategories = await Category.find({
        $or: [
          { category_id: category.category_id },
          { parent_id: category.category_id },
        ],
        status: "active",
      }).lean();

      const categoryIds = relatedCategories.map((c) => c.category_id);
      if (!categoryIds.length) {
        return res.json({ success: true, data: [] });
      }

      const brands = await Brand.find({
        category_ids: { $in: categoryIds },
        status: "active",
      })
        .sort({ brand_id: 1 })
        .lean();

      return res.json({ success: true, data: brands });
    }

    const filter = status === "all" ? {} : { status: "active" };
    const brands = await Brand.find(filter)
      .sort({ brand_id: 1 })
      .lean();

    res.json({ success: true, data: brands });
  } catch (err) {
    console.error("[getAllBrands]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [POST] /api/brands (admin) ──────────────────────────────────────────────
exports.createBrand = async (req, res) => {
  try {
    const { brand_name, logo = "", description = "", category_ids = [], status = "active" } = req.body;
    if (!brand_name?.trim())
      return res.status(400).json({ success: false, message: "Tên thương hiệu không được để trống" });

    const brand_id = await nextBrandId();
    const brand = await Brand.create({
      brand_id,
      brand_name: brand_name.trim(),
      logo,
      description,
      category_ids: (category_ids || []).map((id) => parseInt(id)),
      status,
    });
    res.status(201).json({ success: true, data: brand });
  } catch (err) {
    console.error("[createBrand]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [PUT] /api/brands/:id (admin) ───────────────────────────────────────────
exports.updateBrand = async (req, res) => {
  try {
    const brand_id = parseInt(req.params.id);
    const existing = await Brand.findOne({ brand_id }).lean();
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy thương hiệu" });

    const { brand_name, logo, description, category_ids, status } = req.body;
    const updated = await Brand.findOneAndUpdate(
      { brand_id },
      {
        brand_name: brand_name?.trim() || existing.brand_name,
        logo: logo ?? existing.logo,
        description: description ?? existing.description,
        ...(category_ids !== undefined && { category_ids: category_ids.map((id) => parseInt(id)) }),
        status: status ?? existing.status,
      },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[updateBrand]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [DELETE] /api/brands/:id (admin) ────────────────────────────────────────
exports.deleteBrand = async (req, res) => {
  try {
    const brand_id = parseInt(req.params.id);
    const existing = await Brand.findOne({ brand_id }).lean();
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy thương hiệu" });

    await Brand.deleteOne({ brand_id });
    res.json({ success: true, message: "Đã xoá thương hiệu thành công" });
  } catch (err) {
    console.error("[deleteBrand]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};
