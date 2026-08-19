const express   = require("express");
const router    = express.Router();
const adminAuth = require("../middleware/adminAuth");
const ctrl      = require("../controllers/newsletterController");

router.post("/subscribe", ctrl.subscribe);   // public — form ở footer
router.get("/",           adminAuth, ctrl.getAll); // admin — xem danh sách đã đăng ký

module.exports = router;
