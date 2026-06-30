const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");
const adminAuth = require("../middleware/adminAuth");

router.get("/",       brandController.getAll);
router.post("/",      adminAuth, brandController.createBrand);
router.put("/:id",    adminAuth, brandController.updateBrand);
router.delete("/:id", adminAuth, brandController.deleteBrand);

module.exports = router;
