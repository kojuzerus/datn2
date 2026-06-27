const mongoose = require("mongoose");
const Product = require("./models/productModel");
require("dotenv").config();
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarthub';
console.log('URI', uri);
(async () => {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const admin = db.admin();
    const dbs = await admin.listDatabases();
    console.log('DATABASES', dbs.databases.map(d => d.name));
    const colls = await db.listCollections().toArray();
    console.log('COLLS', colls.map(c => c.name));
    const total = await Product.countDocuments();
    const active = await Product.countDocuments({ status: 'active' });
    console.log('PRODUCT total', total, 'active', active);
    const any = await Product.findOne().lean();
    console.log('ANY', any);
    const statuses = await Product.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    console.log('STATUS', statuses);
  } catch (err) {
    console.error('ERR', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
