// controllers/variantController.js
const Variant = require("../models/variantModel");

// GET /api/variants/product/:productId
exports.getByProduct = async (req, res) => {
  try {
    const variants = await Variant.find({ product_id: parseInt(req.params.productId) }).lean();
    res.json({ success: true, data: variants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/variants/product/:productId  (admin)
exports.create = async (req, res) => {
  try {
    const last   = await Variant.findOne().sort({ variant_id: -1 }).lean();
    const nextId = (last?.variant_id ?? 0) + 1;

    const variant = await Variant.create({
      ...req.body,
      variant_id: nextId,
      product_id: parseInt(req.params.productId),
    });
    res.status(201).json({ success: true, data: variant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/variants/:variantId  (admin)
exports.update = async (req, res) => {
  try {
    const variant = await Variant.findOneAndUpdate(
      { variant_id: parseInt(req.params.variantId) },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!variant)
      return res.status(404).json({ success: false, message: "Không tìm thấy variant" });
    res.json({ success: true, data: variant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/variants/:variantId  (admin)
exports.remove = async (req, res) => {
  try {
    await Variant.findOneAndDelete({ variant_id: parseInt(req.params.variantId) });
    res.json({ success: true, message: "Đã xoá variant" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};