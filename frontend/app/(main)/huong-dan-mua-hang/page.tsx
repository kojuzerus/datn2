import InfoPage from "../../components/InfoPage";
import { Search, CreditCard, Truck, Clock3, ShieldCheck } from "lucide-react";

const cards = [
  { title: "Tìm sản phẩm", description: "Duyệt danh mục rõ ràng, lọc theo nhu cầu và xem nhanh thông tin sản phẩm.", icon: Search, accent: "bg-red-600" },
  { title: "So sánh nhanh", description: "So sánh cấu hình, giá và đánh giá để chọn sản phẩm phù hợp nhất.", icon: ShieldCheck, accent: "bg-amber-500" },
  { title: "Thanh toán linh hoạt", description: "Chọn nhiều phương thức thanh toán an toàn, nhanh chóng và được bảo mật.", icon: CreditCard, accent: "bg-sky-600" },
  { title: "Giao hàng tốc hành", description: "Theo dõi đơn hàng, nhận thông báo và ưu tiên giao nhanh trong nội thành.", icon: Truck, accent: "bg-cyan-600" },
  { title: "Hỗ trợ 24/7", description: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng giải đáp mọi thắc mắc của bạn.", icon: Clock3, accent: "bg-violet-600" },
  { title: "Đảm bảo chất lượng", description: "Sản phẩm chính hãng, đảm bảo đổi trả và bảo hành theo cam kết.", icon: ShieldCheck, accent: "bg-emerald-600" },
];

export default function Page() {
  return (
    <InfoPage
      title="Hướng dẫn mua hàng"
      subtitle="Mua sắm dễ dàng, nhanh chóng và an tâm với hồ trợ tận tâm từ SmartHub."
      cards={cards}
    >
      <div className="mt-12 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Bước 1: Tìm và chọn sản phẩm</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Sử dụng bộ lọc danh mục, giá và thương hiệu để tìm sản phẩm phù hợp. Nhấn vào sản phẩm để xem chi tiết, thông số và hình ảnh thực tế.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Bước 2: Thêm vào giỏ hàng</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Chọn cấu hình hoặc phiên bản mong muốn, điều chỉnh số lượng và bấm thêm vào giỏ. Kiểm tra giỏ hàng trước khi thanh toán.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Bước 3: Thanh toán an toàn</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Chọn phương thức thanh toán phù hợp: chuyển khoản, thẻ ngân hàng hoặc thanh toán khi nhận hàng. Đơn hàng của bạn được mã hóa và xử lý an toàn.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Bước 4: Xác nhận và nhận hàng</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Xác nhận lại địa chỉ, số điện thoại và thời gian giao hàng. Theo dõi trạng thái đơn hàng để nhận ngay khi shipper tới.</p>
          </section>
        </div>

        <div className="space-y-8 rounded-2xl border border-gray-200 bg-red-50 p-8 shadow-sm">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Lưu ý khi mua</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Kiểm tra thông tin bảo hành và chính sách đổi trả trước khi đặt hàng.</li>
              <li>Đọc kỹ mô tả sản phẩm và đánh giá của khách hàng thực tế.</li>
              <li>Nhập chính xác địa chỉ nhận hàng để tránh chậm trễ.</li>
            </ul>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Hướng dẫn nhanh</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Mua bằng 1 cú nhấp:</p>
              <p>Chọn sản phẩm → Thêm giỏ hàng → Xác nhận thông tin → Thanh toán → Nhận hàng.</p>
              <p>Lưu ý: giữ mã đơn hàng và thông tin nhận hàng để dễ tra cứu khi cần.</p>
            </div>
          </div>
        </div>
      </div>
    </InfoPage>
  );
}
