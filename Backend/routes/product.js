const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// ⚠️ Route cụ thể phải đặt TRƯỚC route có param
router.get("/featured",     productController.getFeatured);
router.get("/best-selling", productController.getBestSelling);
router.get("/",             productController.getAll);
router.post("/",            productController.createProduct);
router.get("/:slug",        productController.getBySlug);
router.put("/:id",          productController.updateProduct);
router.delete("/:id",       productController.deleteProduct);

module.exports = router;