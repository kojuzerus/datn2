import InfoPage from "../../components/InfoPage";
import { Search, ClipboardList, MapPin, Clock3, Phone } from "lucide-react";

const cards = [
  { title: "Tìm nhanh đơn hàng", description: "Nhập mã đơn hàng hoặc số điện thoại để tra cứu trạng thái ngay lập tức.", icon: Search, accent: "bg-cyan-600" },
  { title: "Cập nhật trạng thái", description: "Biết chính xác đơn hàng đang ở đâu và khi nào giao đến.", icon: MapPin, accent: "bg-indigo-600" },
  { title: "Lịch sử chi tiết", description: "Xem lại quá trình xử lý từ lúc đặt hàng đến khi giao nhận.", icon: ClipboardList, accent: "bg-slate-700" },
  { title: "Hỗ trợ nhanh", description: "Liên hệ ngay nếu có sai sót hoặc cần hỗ trợ về đơn hàng.", icon: Phone, accent: "bg-red-600" },
  { title: "Dễ dàng và minh bạch", description: "Mọi bước xử lý đều rõ ràng và dễ theo dõi trên trang của chúng tôi.", icon: Clock3, accent: "bg-amber-500" },
];

export default function Page() {
  return (
    <InfoPage
      title="Tra cứu đơn hàng"
      subtitle="Theo dõi đơn hàng của bạn theo từng bước để yên tâm mua sắm cùng SmartHub."
      cards={cards}
      action={{ label: "Tra cứu ngay", href: "/" }}
    >
      <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-2">
          <article>
            <h2 className="text-xl font-semibold text-slate-900">Cách tra cứu</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Nhập mã đơn hàng hoặc số điện thoại tại trang tra cứu để xem trạng thái và lịch sử giao hàng. Nếu cần hỗ trợ, gọi hotline hoặc chat trực tiếp.</p>
          </article>
          <article>
            <h2 className="text-xl font-semibold text-slate-900">Thông tin có thể tra cứu</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-slate-600">
              <li>Trạng thái đơn hàng.</li>
              <li>Đơn vị vận chuyển và mã vận đơn.</li>
              <li>Thời gian dự kiến giao hàng.</li>
              <li>Thông tin trạng thái thanh toán và địa chỉ giao hàng.</li>
            </ul>
          </article>
        </div>
        <div className="mt-8 rounded-xl bg-slate-50 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Khi gặp sự cố</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">Nếu trạng thái đơn hàng không cập nhật đúng, vui lòng liên hệ ngay để được kiểm tra và xử lý trong vòng 24 giờ. Chuẩn bị mã đơn hàng để hỗ trợ nhanh hơn.</p>
        </div>
      </div>
    </InfoPage>
  );
}
