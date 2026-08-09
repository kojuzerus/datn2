require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

  const byEmail = await User.find({ email: 'vkhang952006@gmail.com' }).collation({ locale: 'en', strength: 2 });
  console.log('Theo email vkhang952006@gmail.com:', JSON.stringify(byEmail, null, 2));

  const byPhone = await User.find({ soDienThoai: '0343177842' });
  console.log('Theo SĐT 0343177842:', JSON.stringify(byPhone, null, 2));

  await mongoose.disconnect();
})();
