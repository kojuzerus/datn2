const express      = require("express");
const router       = express.Router();
const adminAuth    = require("../middleware/adminAuth");
const searchCtrl   = require("../controllers/adminSearchController");

router.get("/", adminAuth, searchCtrl.globalSearch);

module.exports = router;
