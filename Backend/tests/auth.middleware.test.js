// Test middleware xác thực JWT — chặn đúng request không hợp lệ, không cho ai
// "đi vòng" xác thực để gọi API cần đăng nhập.
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const SECRET = process.env.JWT_SECRET || "smarthub_secret_2024";

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("middleware/auth", () => {
  test("không có header Authorization → 401", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("header không đúng định dạng 'Bearer <token>' → 401", () => {
    const req = { headers: { authorization: "Basic abc123" } };
    const res = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("token giả/không hợp lệ → 401", () => {
    const req = { headers: { authorization: "Bearer token.gia.mao" } };
    const res = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/không hợp lệ|hết hạn/i) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("token đã hết hạn → 401", () => {
    const expiredToken = jwt.sign({ id: "abc123" }, SECRET, { expiresIn: -10 }); // hết hạn 10s trước
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("token hợp lệ → gán req.userId đúng và cho đi tiếp (next)", () => {
    const token = jwt.sign({ id: "6a4116309148840a5fdf9726" }, SECRET, { expiresIn: "1h" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe("6a4116309148840a5fdf9726");
    expect(res.status).not.toHaveBeenCalled();
  });
});
