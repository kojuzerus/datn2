const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// ⚠️ Route cụ thể phải đặt TRƯỚC route có param
router.get("/featured",     productController.getFeatured);
router.get("/best-selling", productController.getBestSelling);
router.get("/",             productController.getAll);      // ← lên trước /:slug
router.get("/:slug",        productController.getBySlug);   // ← xuống sau

module.exports = router;