const mongoose = require("mongoose");
const Product = require("./models/productModel");
const uri = 'mongodb://localhost:27017/SMARTHUB';
console.log('URI', uri);
(async () => {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const colls = await db.listCollections().toArray();
    console.log('COLLS', colls.map(c => c.name));
    const count = await db.collection('products').countDocuments();
    console.log('products count', count);
    const one = await db.collection('products').findOne();
    console.log('one', one);
  } catch (err) {
    console.error('ERR', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
