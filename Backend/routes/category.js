const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const adminAuth = require("../middleware/adminAuth");

router.get("/",        categoryController.getAll);
router.post("/",       adminAuth, categoryController.createCategory);
router.get("/:slug",   categoryController.getBySlug);
router.put("/:id",     adminAuth, categoryController.updateCategory);
router.delete("/:id",  adminAuth, categoryController.deleteCategory);

module.exports = router;
