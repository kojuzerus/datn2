const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/statsController");

router.get("/dashboard",     ctrl.getDashboardStats);
router.get("/recent-orders", ctrl.getRecentOrders);

module.exports = router;
