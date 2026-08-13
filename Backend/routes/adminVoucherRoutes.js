const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const c = require("../controllers/adminVoucherController");

// Lịch sử khách trúng mã — đặt TRƯỚC "/:id" để không bị route động nuốt mất
router.get("/awarded", adminAuth, c.getAwarded);
router.delete("/awarded/:id", adminAuth, c.resetSpin);

// Quản lý các ô phần thưởng trên vòng quay
router.get("/", adminAuth, c.getAll);
router.post("/", adminAuth, c.create);
router.put("/:id", adminAuth, c.update);
router.patch("/:id/toggle", adminAuth, c.toggleActive);
router.delete("/:id", adminAuth, c.remove);

module.exports = router;
