const Brand = require("../models/brandModel");
const Category = require("../models/categoryModel");

exports.getAll = async (req, res) => {
  try {
    const { category_slug } = req.query;

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

    const brands = await Brand.find({ status: "active" })
      .sort({ brand_id: 1 })
      .lean();

    res.json({ success: true, data: brands });
  } catch (err) {
    console.error("[getAllBrands]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};
