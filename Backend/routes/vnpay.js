const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentCtrl = require('../controllers/paymentController');

router.post('/create_payment', auth, paymentCtrl.createPaymentUrl);
router.get('/return', paymentCtrl.returnHandler);

module.exports = router;
    