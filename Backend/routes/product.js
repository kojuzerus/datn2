const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const adminAuth = require("../middleware/adminAuth");

// ⚠️ Route cụ thể phải đặt TRƯỚC route có param
router.get("/featured",     productController.getFeatured);
router.get("/best-selling", productController.getBestSelling);
router.get("/",             productController.getAll);
router.post("/",            adminAuth, productController.createProduct);
router.get("/:slug",        productController.getBySlug);
router.put("/:id",          adminAuth, productController.updateProduct);
router.delete("/:id",       adminAuth, productController.deleteProduct);

module.exports = router;