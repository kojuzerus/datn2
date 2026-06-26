import InfoPage from "../../components/InfoPage";
import { RefreshCw, CalendarDays, ShieldCheck, ClipboardList, MessageCircle } from "lucide-react";

const cards = [
  { title: "Thời hạn đổi trả", description: "Hỗ trợ đổi trả trong vòng 30 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn mới.", icon: CalendarDays, accent: "bg-sky-600" },
  { title: "Điều kiện đổi trả", description: "Sản phẩm còn nguyên vẹn, đầy đủ phụ kiện, tem bảo hành và chưa qua sửa chữa.", icon: ShieldCheck, accent: "bg-emerald-600" },
  { title: "Đổi trả nhanh", description: "Quy trình đổi trả đơn giản, nhận phản hồi trong 24h và xử lý trong 2-3 ngày.", icon: RefreshCw, accent: "bg-red-600" },
  { title: "Giải đáp miễn phí", description: "Nhận tư vấn đổi trả qua chat, hotline hoặc email mà không mất phí.", icon: MessageCircle, accent: "bg-violet-600" },
  { title: "Hoàn tiền linh hoạt", description: "Hoàn tiền qua ví điện tử hoặc chuyển khoản tùy theo phương thức thanh toán ban đầu.", icon: ClipboardList, accent: "bg-amber-500" },
];

export default function Page() {
  return (
    <InfoPage
      title="Chính sách đổi trả"
      subtitle="Cam kết hỗ trợ đổi trả dễ dàng và minh bạch cho mọi đơn hàng tại SmartHub."
      cards={cards}
    >
      <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-2">
          <article>
            <h2 className="text-xl font-semibold text-slate-900">Khi nào được đổi trả?</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Bạn có thể yêu cầu đổi trả nếu sản phẩm không đúng mô tả, bị lỗi kỹ thuật hoặc trong trường hợp sản phẩm bị hư hỏng do vận chuyển.</p>
          </article>
          <article>
            <h2 className="text-xl font-semibold text-slate-900">Thủ tục đổi trả</h2>
            <ol className="mt-4 space-y-4 text-sm text-slate-600">
              <li>1. Liên hệ CSKH để xác nhận điều kiện đổi trả.</li>
              <li>2. Gửi thông tin đơn hàng và hình ảnh sản phẩm.</li>
              <li>3. Nhân viên xác nhận và hướng dẫn gửi trả hàng.</li>
              <li>4. Khi nhận hàng, chúng tôi sẽ xử lý đổi trả trong vòng 2-3 ngày.</li>
            </ol>
          </article>
        </div>
        <div className="mt-8 rounded-xl bg-slate-50 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Lưu ý cần biết</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">Giữ lại hộp, phụ kiện và hóa đơn gốc để quy trình đổi trả diễn ra nhanh nhất. Sản phẩm đã qua sử dụng hoặc hư hỏng do tác động lực có thể không đủ điều kiện đổi trả.</p>
        </div>
      </div>
    </InfoPage>
  );
}
