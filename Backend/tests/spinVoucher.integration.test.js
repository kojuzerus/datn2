// Test nguyên luồng HTTP thật (qua supertest) cho Vòng quay may mắn — đảm bảo
// đúng quy tắc quan trọng nhất: MỖI TÀI KHOẢN CHỈ ĐƯỢC QUAY 1 LẦN. Đây là chỗ
// nếu có bug (VD bấm nhanh 2 lần) thì khách có thể "cày" voucher vô hạn.
//
// Chốt cứng JWT_SECRET TRƯỚC khi require("../app") — vì app.js tự gọi
// dotenv.config() và nạp JWT_SECRET thật từ .env, mà dotenv mặc định không
// ghi đè biến env đã có sẵn, nên set trước ở đây thì cả app lẫn test đều
// dùng chung đúng 1 secret.
process.env.JWT_SECRET = "test_secret_khong_dung_that";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { connect, closeDatabase, clearDatabase } = require("./dbTestUtils");
const Voucher = require("../models/Voucher");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET;

let app;

beforeAll(async () => {
  await connect();
  app = require("../app"); // require sau khi đã connect DB in-memory
});
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

function tokenFor(userId) {
  return jwt.sign({ id: String(userId) }, SECRET, { expiresIn: "1h" });
}

describe("POST /api/spin/spin", () => {
  test("chưa đăng nhập → 401, không cho quay", async () => {
    const res = await request(app).post("/api/spin/spin");
    expect(res.status).toBe(401);
  });

  test("không có chương trình quay số nào (chưa seed Voucher) → báo lỗi", async () => {
    const user = await User.create({ hoTen: "Khách A", email: "a@test.com" });
    const res = await request(app)
      .post("/api/spin/spin")
      .set("Authorization", `Bearer ${tokenFor(user._id)}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/không khả dụng/i);
  });

  test("quay lần đầu → thành công, trả về đúng phần thưởng", async () => {
    await Voucher.create({ code: "SPIN5", label: "Giảm 5%", type: "percent", value: 5, isActive: true });
    const user = await User.create({ hoTen: "Khách B", email: "b@test.com" });

    const res = await request(app)
      .post("/api/spin/spin")
      .set("Authorization", `Bearer ${tokenFor(user._id)}`);

    expect(res.status).toBe(200);
    expect(res.body.voucher.code).toBe("SPIN5");
  });

  test("quay lần 2 với cùng tài khoản → BỊ CHẶN, không cho quay thêm", async () => {
    await Voucher.create({ code: "SPIN5", label: "Giảm 5%", type: "percent", value: 5, isActive: true });
    const user = await User.create({ hoTen: "Khách C", email: "c@test.com" });
    const auth = { Authorization: `Bearer ${tokenFor(user._id)}` };

    const lanDau = await request(app).post("/api/spin/spin").set(auth);
    expect(lanDau.status).toBe(200);

    const lanHai = await request(app).post("/api/spin/spin").set(auth);
    expect(lanHai.status).toBe(400);
    expect(lanHai.body.message).toMatch(/đã sử dụng lượt quay/i);
  });

  test("2 tài khoản khác nhau đều quay được, độc lập với nhau", async () => {
    await Voucher.create({ code: "SPIN5", label: "Giảm 5%", type: "percent", value: 5, isActive: true });
    const userX = await User.create({ hoTen: "Khách X", email: "x@test.com" });
    const userY = await User.create({ hoTen: "Khách Y", email: "y@test.com" });

    const resX = await request(app)
      .post("/api/spin/spin")
      .set("Authorization", `Bearer ${tokenFor(userX._id)}`);
    const resY = await request(app)
      .post("/api/spin/spin")
      .set("Authorization", `Bearer ${tokenFor(userY._id)}`);

    expect(resX.status).toBe(200);
    expect(resY.status).toBe(200);
  });
});

describe("GET /api/spin/spin-status", () => {
  test("chưa quay → hasSpun=false", async () => {
    const user = await User.create({ hoTen: "Khách D", email: "d@test.com" });
    const res = await request(app)
      .get("/api/spin/spin-status")
      .set("Authorization", `Bearer ${tokenFor(user._id)}`);
    expect(res.body.hasSpun).toBe(false);
  });

  test("đã quay → hasSpun=true, trả đúng mã đã trúng", async () => {
    await Voucher.create({ code: "SPIN5", label: "Giảm 5%", type: "percent", value: 5, isActive: true });
    const user = await User.create({ hoTen: "Khách E", email: "e@test.com" });
    const auth = { Authorization: `Bearer ${tokenFor(user._id)}` };

    await request(app).post("/api/spin/spin").set(auth);
    const res = await request(app).get("/api/spin/spin-status").set(auth);

    expect(res.body.hasSpun).toBe(true);
    expect(res.body.voucher.code).toBe("SPIN5");
  });
});
