const Category = require("../models/categoryModel");

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find({ status: "active" })
      .sort({ category_id: 1 })
      .lean();

    res.json({ success: true, data: categories });
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
