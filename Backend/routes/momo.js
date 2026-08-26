const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const momoCtrl = require('../controllers/momoController');

router.post('/create_payment', auth, momoCtrl.createPaymentUrl);
router.get('/return', momoCtrl.returnHandler);
router.post('/ipn', momoCtrl.ipnHandler);

module.exports = router;
