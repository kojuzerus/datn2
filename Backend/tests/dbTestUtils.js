// Helper dùng chung cho mọi file test cần DB: dựng 1 MongoDB in-memory riêng
// (không phải Atlas thật) cho mỗi lần chạy test — an toàn, không sợ làm hỏng
// dữ liệu thật, và chạy được cả khi không có mạng tới Atlas.
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

async function connect() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
}

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = { connect, closeDatabase, clearDatabase };
