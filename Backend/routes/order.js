const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/orderController");
const auth    = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// User routes
router.post("/",           auth, ctrl.createOrder);
router.get("/",            auth, ctrl.getMyOrders);
router.get("/:id",         auth, ctrl.getOrderById);
router.put("/:id/cancel",  auth, ctrl.cancelOrder);

// Admin routes
router.get("/admin/all",           adminAuth, ctrl.getAllOrders);
router.put("/admin/:id/status",    adminAuth, ctrl.updateOrderStatus);

module.exports = router;
