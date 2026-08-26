const crypto = require('crypto');
const Order = require('../models/orderModel');
const { adjustTotalSold, adjustStock, restoreCartItems } = require('./orderController');

// Tách order._id thật ra khỏi orderId gửi cho MoMo (orderId phải là duy nhất
// với mỗi request nên mình ghép thêm timestamp: "<mongoId>_<ts>")
const extractMongoOrderId = (momoOrderId) => String(momoOrderId || '').split('_')[0];

// POST /api/momo/create_payment
exports.createPaymentUrl = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Missing orderId' });

    const order = await Order.findOne({ _id: orderId, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const partnerCode = (process.env.MOMO_PARTNER_CODE || '').trim();
    const accessKey = (process.env.MOMO_ACCESS_KEY || '').trim();
    const secretKey = (process.env.MOMO_SECRET_KEY || '').trim();
    const endpoint = (process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create').trim();

    if (!partnerCode || !accessKey || !secretKey) {
      return res.status(500).json({ success: false, message: 'MoMo not configured on server' });
    }

    // MoMo yêu cầu amount là số nguyên VND (không nhân 100 như VNPAY)
    const amount = Math.round(order.tongThanhToan);

    const base = process.env.API_BASE_URL ||
      `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

    const momoOrderId = `${order._id}_${Date.now()}`;
    const requestId = `${momoOrderId}_req`;
    const orderInfo = `Thanh toan don hang ${order._id}`;
    const redirectUrl = `${base}/api/momo/return`;
    const ipnUrl = `${base}/api/momo/ipn`;
    const requestType = 'captureWallet';
    const extraData = '';
    const partnerName = 'SmartHub';
    const storeId = 'SmartHubStore';
    const lang = 'vi';

    // Chuỗi ký phải theo ĐÚNG thứ tự alphabet của tên field mà MoMo yêu cầu
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${momoOrderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const body = {
      partnerCode,
      partnerName,
      storeId,
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      extraData,
      requestType,
      signature,
    };

    const momoRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await momoRes.json();

    console.log('--- MoMo Create Payment Response ---', data);

    if (data.resultCode === 0 && data.payUrl) {
      return res.json({ success: true, url: data.payUrl });
    }

    return res.status(500).json({
      success: false,
      message: data.message || 'Lỗi tạo URL MoMo',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating MoMo payment URL' });
  }
};

// Xác thực chữ ký MoMo gửi về (dùng chung cho redirect + IPN — cùng bộ field)
const verifyMomoSignature = (params, secretKey) => {
  const {
    amount, extraData, message, orderId, orderInfo, orderType,
    partnerCode, payType, requestId, responseTime, resultCode, transId, signature,
  } = params;

  const rawSignature =
    `accessKey=${(process.env.MOMO_ACCESS_KEY || '').trim()}` +
    `&amount=${amount}` +
    `&extraData=${extraData || ''}` +
    `&message=${message}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&orderType=${orderType}` +
    `&partnerCode=${partnerCode}` +
    `&payType=${payType}` +
    `&requestId=${requestId}` +
    `&responseTime=${responseTime}` +
    `&resultCode=${resultCode}` +
    `&transId=${transId}`;

  const expected = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  return expected.toLowerCase() === String(signature || '').toLowerCase();
};

// Cập nhật trạng thái đơn hàng dựa trên kết quả MoMo trả về (dùng chung cho
// return + ipn, có check trạng thái cũ để không xử lý lặp lại nhiều lần)
const applyMomoResult = async (mongoOrderId, resultCode) => {
  const order = await Order.findById(mongoOrderId);
  if (!order) return null;

  const trangThaiCu = order.trangThai;
  const success = String(resultCode) === '0';
  order.trangThai = success ? 'da_xac_nhan' : 'da_huy';

  if (order.trangThai === 'da_huy' && trangThaiCu !== 'da_huy') {
    await adjustTotalSold(order.items, -1);
    await adjustStock(order.items, 1);
    await restoreCartItems(order.userId, order.items);
  }

  await order.save();
  return order;
};

// GET /api/momo/return — MoMo redirect trình duyệt của khách về đây
exports.returnHandler = async (req, res) => {
  try {
    const params = req.query;
    const secretKey = (process.env.MOMO_SECRET_KEY || '').trim();
    if (!secretKey) return res.status(500).send('MoMo not configured');

    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const mongoOrderId = extractMongoOrderId(params.orderId);

    console.log('--- MoMo Return Params ---', params);

    const validSig = verifyMomoSignature(params, secretKey);
    if (!validSig) return res.status(400).send('Invalid signature');

    await applyMomoResult(mongoOrderId, params.resultCode);

    if (String(params.resultCode) === '0') {
      return res.redirect(`${frontend}/dat-hang-thanh-cong?orderId=${mongoOrderId}&method=momo`);
    }
    return res.redirect(`${frontend}/thanhtoan?status=failed&orderId=${mongoOrderId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// POST /api/momo/ipn — MoMo gọi server-to-server để xác nhận (đáng tin cậy
// hơn return vì không đi qua trình duyệt khách, nhưng cần backend có domain
// public thì MoMo mới gọi tới được — ở local dev sẽ không có, xử lý chính
// nằm ở returnHandler phía trên)
exports.ipnHandler = async (req, res) => {
  try {
    const params = req.body;
    const secretKey = (process.env.MOMO_SECRET_KEY || '').trim();
    if (!secretKey) return res.status(500).json({ message: 'MoMo not configured' });

    console.log('--- MoMo IPN Params ---', params);

    const validSig = verifyMomoSignature(params, secretKey);
    if (!validSig) return res.status(400).json({ message: 'Invalid signature' });

    const mongoOrderId = extractMongoOrderId(params.orderId);
    await applyMomoResult(mongoOrderId, params.resultCode);

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
