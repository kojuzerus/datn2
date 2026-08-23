// frontend/lib/orderCode.ts
// Mã đơn hàng NGẮN hiển thị cho người dùng — lấy 6 ký tự cuối của Mongo
// ObjectId (24 ký tự hex), viết hoa, thêm "#" phía trước. Trước đây trang
// khách hàng (đơn hàng của tôi, chi tiết đơn, trang đặt hàng thành công) hiện
// nguyên _id 24 ký tự trong khi trang admin chỉ hiện 6 ký tự cuối — 2 bên
// nhìn ra "2 mã khác nhau" cho cùng 1 đơn, khó đối chiếu khi khách báo mã.
// Dùng chung hàm này ở MỌI nơi hiển thị mã đơn cho người dùng để luôn khớp
// với admin.
export function formatOrderCode(id: string | undefined | null): string {
  if (!id) return "";
  return `#${id.slice(-6).toUpperCase()}`;
}
