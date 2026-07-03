const crypto = require('crypto');
const Order = require('../models/orderModel');

// Hàm encode theo chuẩn VNPAY
const vnpayEncode = (value) => {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/%21/g, '!')
    .replace(/%27/g, "'")
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%2A/g, '*');
};

// Build chuỗi signData
const buildVnpaySignData = (params) => {
  return Object.keys(params)
    .sort()
    .map((key) => `${key}=${vnpayEncode(params[key])}`)
    .join('&');
};

// Build query + hash
const buildVnpayQuery = (params, secret) => {
  const signData = buildVnpaySignData(params);
  const secureHash = crypto.createHmac('sha512', secret).update(signData).digest('hex');
  const query = `${signData}&vnp_SecureHashType=SHA512&vnp_SecureHash=${secureHash}`;
  return { query, signData, secureHash };
};

// POST /api/vnpay/create_payment
exports.createPaymentUrl = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Missing orderId' });

    const order = await Order.findOne({ _id: orderId, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const vnpTmnCode = (process.env.VNP_TMN_CODE || '').trim();
    const vnpHashSecret = (process.env.VNP_HASH_SECRET || '').trim();
    const vnpUrlBase = (process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html').trim();

    if (!vnpTmnCode || !vnpHashSecret) {
      return res.status(500).json({ success: false, message: 'VNPAY not configured on server' });
    }

    // VNPAY yêu cầu amount = VND * 100
    const amount = Math.round(order.tongThanhToan) * 100;

    const createDate = new Date();
    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const d_day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      return `${y}${m}${d_day}${h}${min}${s}`;
    };

    const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpTmnCode,
      vnp_Amount: String(amount),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: String(order._id),
      vnp_OrderInfo: `Thanh toan don hang ${order._id}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: (() => {
        const base = process.env.API_BASE_URL ||
          `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
        return `${base}/api/vnpay/return`;
      })(),
      vnp_CreateDate: formatDate(createDate),
      vnp_IpAddr: Array.isArray(ipAddr) ? ipAddr[0] : ipAddr,
    };

    const { query, signData, secureHash } = buildVnpayQuery(params, vnpHashSecret);
    const paymentUrl = `${vnpUrlBase}?${query}`;

    // Debug log
    console.log('--- VNPAY Request Params ---');
    Object.keys(params).sort().forEach(key => console.log(`${key}=${params[key]}`));
    console.log('SignData:', signData);
    console.log('SecureHash:', secureHash);

    res.json({ success: true, url: paymentUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating payment URL' });
  }
};

// GET /api/vnpay/return
exports.returnHandler = async (req, res) => {
  try {
    const vnpParams = { ...req.query };
    const secureHash = vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const vnpHashSecret = (process.env.VNP_HASH_SECRET || '').trim();
    if (!vnpHashSecret) return res.status(500).send('VNPAY not configured');

    const signData = buildVnpaySignData(vnpParams);
    const checkSum = crypto.createHmac('sha512', vnpHashSecret).update(signData).digest('hex');

    const vnpResponseCode = vnpParams.vnp_ResponseCode;
    const txnRef = vnpParams.vnp_TxnRef;

    // Debug log
    console.log('--- VNPAY Return Params ---');
    Object.keys(vnpParams).sort().forEach(key => console.log(`${key}=${vnpParams[key]}`));
    console.log('SignData:', signData);
    console.log('Computed Hash:', checkSum);
    console.log('Received Hash:', secureHash);

    if (checkSum.toLowerCase() === (secureHash || '').toLowerCase()) {
      const order = await Order.findById(txnRef);
      if (order) {
        order.trangThai = (vnpResponseCode === '00') ? 'da_xac_nhan' : 'da_huy';
        await order.save();
      }

      const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
      if (vnpResponseCode === '00') {
        return res.redirect(`${frontend}/dat-hang-thanh-cong?orderId=${txnRef}&method=vnpay`);
      }
      return res.redirect(`${frontend}/thanhtoan?status=failed&orderId=${txnRef}`);
    }

    res.status(400).send('Invalid signature');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
