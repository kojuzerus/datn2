const express   = require("express");
const router    = express.Router();
const auth      = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const reviewController = require("../controllers/reviewController");

// Admin quản lý đánh giá
router.get("/admin/all",      adminAuth, reviewController.getAllAdmin);
router.put("/:id/visibility", adminAuth, reviewController.toggleVisibility);
router.delete("/:id",         adminAuth, reviewController.remove);

// Public + user
router.get("/product/:productId",    reviewController.getByProduct);
router.get("/can-review/:productId", auth, reviewController.canReview);
router.post("/",                     auth, reviewController.create);

module.exports = router;
