const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/statsController");
const adminAuth = require("../middleware/adminAuth");

router.get("/dashboard",     adminAuth, ctrl.getDashboardStats);
router.get("/recent-orders", adminAuth, ctrl.getRecentOrders);

module.exports = router;
