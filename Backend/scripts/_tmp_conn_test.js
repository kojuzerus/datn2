require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
console.log('Connecting to:', uri ? uri.replace(/:[^:@]+@/, ':***@') : 'MISSING URI');
mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(() => { console.log('OK connected'); process.exit(0); })
  .catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
