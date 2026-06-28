const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/userController");
const adminAuth = require("../middleware/adminAuth");

router.get("/",            adminAuth, ctrl.getAllUsers);
router.get("/:id",         adminAuth, ctrl.getUserById);
router.put("/:id/status",  adminAuth, ctrl.updateUserStatus);
router.put("/:id/role",    adminAuth, ctrl.updateUserRole);
router.delete("/:id",      adminAuth, ctrl.deleteUser);

module.exports = router;
