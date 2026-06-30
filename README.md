vừa update thêm backend nhé có kết nối database rồi nhé (Phước kết nối)
vừa update lại cấu trúc thư mục để tranh bị lỗi layout của trang admin và trang chủ nhé !!!

lệnh tải về những gì code thay đổi trên github (git pull origin main)

vừa cập nhật thêm kết nối variants có hiện sản phẩm nhưng chưa có data ảnh !!!

vừa thêm danh mục ngoài header.

(vkhang) đã làm đăng ký và đăng nhập - đã push

(vk) đã làm trang giỏ hàng - đã push

mới sửa lại một tí về header và footer trang admin. từ nay dùng chung header và footer trang admin nó nằm trong: (admin/ layout) và đã thêm trang quản lý sp


03/06 lấy DL database hiện thị danh mục làm lại logo , làm lại header (Phước)

 Đã thêm trang sp và chi tiết. có chức năng tìm kiếm rồi nhé, tuy nhiên hãy cải tiến trang sản phẩm vì nó chưa hợp lí lắm. đã có thể crud rồi nhé lỗi thì note phía dưới nhé .(mk)
 
 Xem tất cả sản phẩm, chức năng sắp xếp và phân trang(KLinh)
 
 
 làm lại trang giỏ hàng, làm thêm trang thanh toán(Phuoc)

làm trang profile cập nhật địa chit người dùng(Phước)


Backend:

Backend/controllers/productController.js: lưu ảnh riêng cho từng biến thể vào bảng product_images (đã có sẵn, gắn theo variant_id). Khi tạo/sửa sản phẩm, xóa ảnh biến thể cũ và lưu ảnh mới tương ứng. formatProduct trả về variant.image cho từng biến thể.
Admin form (frontend/app/admin/products/page.tsx):

Mỗi dòng biến thể giờ có thêm dòng phụ: ô nhập URL ảnh + thumbnail preview
AI gợi ý giờ tự động: tìm ảnh sản phẩm chính + gọi tìm ảnh riêng cho từng biến thể (theo tên sản phẩm + màu), chạy song song qua Serper.dev
Trang sản phẩm (sanpham/[slug]/page.tsx):

Khi khách chọn màu/biến thể, ảnh chính tự đổi sang ảnh riêng của biến thể đó (nếu có), thay vì luôn hiện ảnh chung

Done Ai tự gợi ý sp và tự thêm biến thể tự thêm ảnh (MK)
Đã tự động thêm biến thể hình ảnh biến thể và giá theo thị trường (MK)
Done quản lý đơn hàng ( theo luồng tiến logic có popup xác nhận ) (MK)

Done quản lý khách hàng (MK)
Backend:
Thêm field status (active/banned) vào User model - chặn đăng nhập nếu bị khóa
API mới: GET /api/admin/users (danh sách + thống kê đơn hàng/chi tiêu mỗi khách), GET /api/admin/users/:id (chi tiết + lịch sử đơn hàng), PUT .../status, PUT .../role, DELETE .../:id
Frontend:
Bảng danh sách: avatar chữ cái đầu, tên/loại tài khoản (local/Google/Zalo), SĐT/email, vai trò (badge), trạng thái, số đơn hàng, tổng chi tiêu, ngày tham gia
Lọc theo tên/email/SĐT, vai trò, trạng thái
Thao tác nhanh trên bảng: xem chi tiết, khóa/mở khóa, xóa
Modal chi tiết: thông tin đầy đủ + nút "Đặt làm Admin"/"Khóa tài khoản" + lịch sử đơn hàng
Mọi hành động nguy hiểm (khóa, xóa, cấp quyền admin) đều có popup xác nhận trước khi thực hiện

Tạo lại tài khoản admin bằng email thật:
Email: admin@smarthub.vn
Mật khẩu: Admin@123
Đăng nhập giờ hỗ trợ cả SĐT hoặc email trong cùng 1 ô (backend tìm theo $or) (MK)

Done quản lý danh mục có brands - fix chức năng đăng ký (không phân biệt chữ hoa chữ thường) - fix (chức năng không bắt buộc nhập email "trước khi fix: không nhập mail dù phần mail không bắt buộc nhập nhưng nếu không nhập sẽ bị lỗi server" sau khi fix: đã có thể không cần nhập).
Done chức năng yêu thích - bắt buộc đăng nhập mới được yêu thích.
Done các nút có chức năng click (MK)


Phước (làm quá trời luôn không biết note gì cả).





Phần chưa làm: Mã giảm - vòng quay may mắn - Flash sale - chức năng nhận xét và đánh giá sau khi mua sản phẩm - chức năng hỏi đáp của khách hàng trước khi mua sản phẩm. 
