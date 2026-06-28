const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/userController");

router.get("/",            ctrl.getAllUsers);
router.get("/:id",         ctrl.getUserById);
router.put("/:id/status",  ctrl.updateUserStatus);
router.put("/:id/role",    ctrl.updateUserRole);
router.delete("/:id",      ctrl.deleteUser);

module.exports = router;
