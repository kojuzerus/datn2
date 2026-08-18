// Test logic tính giảm giá — phần rủi ro cao nhất trong hệ thống (sai 1 dòng
// là giảm nhầm giá, lỗ vốn thật). Test thẳng hàm checkPromo() được dùng chung
// cho cả trang thanh toán (validateCode) và lúc tạo đơn hàng thật (orderController).
const { connect, closeDatabase, clearDatabase } = require("./dbTestUtils");
const { checkPromo } = require("../controllers/promotionController");
const Promotion = require("../models/promotionModel");
const Voucher = require("../models/Voucher");
const UserVoucher = require("../models/UserVoucher");
const User = require("../models/User");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe("checkPromo — mã khuyến mãi thường (Promotion)", () => {
  const activePromo = (overrides = {}) => ({
    code: "SALE10",
    description: "Giảm 10%",
    discount_type: "percent",
    discount_value: 10,
    max_discount: 50000,
    min_order_value: 100000,
    status: "active",
    start_date: new Date(Date.now() - 86400000), // hôm qua
    end_date: new Date(Date.now() + 86400000), // ngày mai
    ...overrides,
  });

  test("mã không tồn tại → báo lỗi rõ ràng", async () => {
    const result = await checkPromo("KHONGTONTAI", 200000);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/không tồn tại/i);
  });

  test("giảm % đúng, có trần giảm tối đa (max_discount)", async () => {
    await Promotion.create(activePromo()); // giảm 10%, tối đa 50.000đ
    const result = await checkPromo("SALE10", 1000000); // 10% của 1tr = 100.000đ > trần 50.000đ
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(50000); // phải bị chặn ở trần, không phải 100.000đ
  });

  test("giảm % không vượt trần khi đơn nhỏ", async () => {
    await Promotion.create(activePromo());
    const result = await checkPromo("SALE10", 200000); // 10% của 200k = 20.000đ, dưới trần
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(20000);
  });

  test("giảm số tiền cố định (fixed)", async () => {
    await Promotion.create(
      activePromo({ code: "GIAM50K", discount_type: "fixed", discount_value: 50000, max_discount: null }),
    );
    const result = await checkPromo("GIAM50K", 300000);
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(50000);
  });

  test("đơn hàng chưa đạt tối thiểu → từ chối", async () => {
    await Promotion.create(activePromo({ min_order_value: 500000 }));
    const result = await checkPromo("SALE10", 100000);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/tối thiểu/i);
  });

  test("mã đã hết hạn → từ chối", async () => {
    await Promotion.create(
      activePromo({ end_date: new Date(Date.now() - 3600000) }), // hết hạn 1 tiếng trước
    );
    const result = await checkPromo("SALE10", 200000);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/hết hạn/i);
  });

  test("mã chưa tới ngày áp dụng → từ chối", async () => {
    await Promotion.create(
      activePromo({ start_date: new Date(Date.now() + 86400000) }), // mai mới bắt đầu
    );
    const result = await checkPromo("SALE10", 200000);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/chưa đến thời gian/i);
  });

  test("mã bị vô hiệu hóa (status inactive) → từ chối", async () => {
    await Promotion.create(activePromo({ status: "inactive" }));
    const result = await checkPromo("SALE10", 200000);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/vô hiệu hóa/i);
  });

  test("mã đã hết lượt sử dụng (usage_limit) → từ chối", async () => {
    await Promotion.create(activePromo({ usage_limit: 5, used_count: 5 }));
    const result = await checkPromo("SALE10", 200000);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/hết lượt/i);
  });

  test("giảm giá không bao giờ vượt quá tổng đơn hàng", async () => {
    // Đơn 30.000đ, mã fixed giảm 50.000đ → chỉ được giảm tối đa 30.000đ, không âm tiền
    await Promotion.create(
      activePromo({
        code: "GIAM50K", discount_type: "fixed", discount_value: 50000,
        max_discount: null, min_order_value: 0,
      }),
    );
    const result = await checkPromo("GIAM50K", 30000);
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(30000);
  });
});

describe("checkPromo — mã trúng từ Vòng quay may mắn (UserVoucher)", () => {
  async function seedSpinVoucher({ userId, type = "fixed", value = 50000, isUsed = false }) {
    const voucher = await Voucher.create({
      code: "SPIN50K",
      label: "Giảm 50.000đ",
      type,
      value,
      isActive: true,
    });
    await UserVoucher.create({
      userId,
      voucherId: voucher._id,
      code: "SPIN50K",
      isUsed,
    });
    return voucher;
  }

  test("chưa đăng nhập (không có userId) → từ chối", async () => {
    await seedSpinVoucher({ userId: new (require("mongoose").Types.ObjectId)() });
    const result = await checkPromo("SPIN50K", 200000, null);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/đăng nhập/i);
  });

  test("đúng chủ sở hữu, chưa dùng → áp mã thành công", async () => {
    const user = await User.create({ hoTen: "Test User", email: "a@test.com" });
    await seedSpinVoucher({ userId: user._id });
    const result = await checkPromo("SPIN50K", 200000, user._id);
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(50000);
    expect(result.nguon).toBe("spin");
  });

  test("mã đã được dùng rồi (isUsed=true) → từ chối, không cho dùng lại", async () => {
    const user = await User.create({ hoTen: "Test User 2", email: "b@test.com" });
    await seedSpinVoucher({ userId: user._id, isUsed: true });
    const result = await checkPromo("SPIN50K", 200000, user._id);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/đã được sử dụng/i);
  });

  test("người khác không phải chủ sở hữu mã → từ chối", async () => {
    const owner = await User.create({ hoTen: "Chủ mã", email: "owner@test.com" });
    const stranger = await User.create({ hoTen: "Người lạ", email: "stranger@test.com" });
    await seedSpinVoucher({ userId: owner._id });
    const result = await checkPromo("SPIN50K", 200000, stranger._id);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/chưa trúng mã này/i);
  });

  test("trúng ô 'chúc may mắn lần sau' (type=none) → không có giá trị, từ chối", async () => {
    const user = await User.create({ hoTen: "Test User 3", email: "c@test.com" });
    await seedSpinVoucher({ userId: user._id, type: "none", value: 0 });
    const result = await checkPromo("SPIN50K", 200000, user._id);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/không có giá trị/i);
  });
});
