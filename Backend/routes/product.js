const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/featured", productController.getFeatured);
router.get("/best-selling", productController.getBestSelling);
router.get("/:slug", productController.getBySlug);
router.get("/", productController.getAll);

module.exports = router;
