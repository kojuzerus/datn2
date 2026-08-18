module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  // Mỗi test dùng 1 MongoDB in-memory riêng (setup/teardown trong từng file test),
  // không đụng tới database Atlas thật — an toàn để chạy bất cứ lúc nào.
  testTimeout: 30000,
  verbose: true,
};
