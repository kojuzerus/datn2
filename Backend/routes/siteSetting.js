const express   = require("express");
const router    = express.Router();
const ctrl      = require("../controllers/siteSettingController");
const adminAuth = require("../middleware/adminAuth");

router.get("/",  ctrl.getSettings);          // public
router.put("/",  adminAuth, ctrl.updateSettings);  // admin only

module.exports = router;
