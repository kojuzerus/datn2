const express = require("express");
const router = express.Router();
const {
  getPrizeList,
  getSpinStatus,
  spinVoucher,
  applyVoucher,
} = require("../controllers/voucherController");

const auth = require("../middleware/auth"); // xem voucherRoutes dùng file nào

router.get("/prizes", getPrizeList);
router.get("/spin-status", auth, getSpinStatus);
router.post("/spin", auth, spinVoucher);
router.post("/apply", auth, applyVoucher);

module.exports = router;
