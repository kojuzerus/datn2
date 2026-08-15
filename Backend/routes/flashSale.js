const express   = require("express");
const router    = express.Router();
const adminAuth = require("../middleware/adminAuth");
const flashSaleController = require("../controllers/flashSaleController");

// Khách xem các đợt flash sale đang diễn ra / sắp mở (không cần đăng nhập)
router.get("/active",   flashSaleController.getActive);
router.get("/upcoming", flashSaleController.getUpcoming);

// Admin: tìm biến thể sản phẩm để chọn khi tạo/sửa đợt flash sale
router.get("/variant-options", adminAuth, flashSaleController.searchVariantOptions);

// Admin quản lý flash sale
router.get("/",       adminAuth, flashSaleController.getAll);
router.post("/",      adminAuth, flashSaleController.create);
router.put("/:id",    adminAuth, flashSaleController.update);
router.delete("/:id", adminAuth, flashSaleController.remove);

module.exports = router;
