const express   = require("express");
const router    = express.Router();
const auth      = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const promotionController = require("../controllers/promotionController");

// Khách hàng áp mã ở trang thanh toán
router.post("/validate", auth, promotionController.validateCode);

// Admin quản lý mã
router.get("/",       adminAuth, promotionController.getAll);
router.post("/",      adminAuth, promotionController.create);
router.put("/:id",    adminAuth, promotionController.update);
router.delete("/:id", adminAuth, promotionController.remove);

module.exports = router;
