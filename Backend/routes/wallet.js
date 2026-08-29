const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const walletController = require("../controllers/walletController");

// Lấy số dư + lịch sử giao dịch
router.get("/", auth, walletController.getWallet);

// Tài khoản ngân hàng
router.post("/bank-accounts", auth, walletController.addBankAccount);
router.get("/bank-accounts", auth, walletController.getBankAccounts);
router.delete("/bank-accounts/:id", auth, walletController.deleteBankAccount);

// Rút tiền
router.post("/withdraw", auth, walletController.requestWithdrawal);
router.get("/withdrawals", auth, walletController.getWithdrawals);
router.post("/withdrawals/:id/cancel", auth, walletController.cancelWithdrawal);

module.exports = router;
