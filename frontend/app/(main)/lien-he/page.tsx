import InfoPage from "../../components/InfoPage";
import { Mail, Phone, MapPin, Clock3, MessageCircle } from "lucide-react";

const cards = [
  { title: "Email hỗ trợ", description: "Gửi email cho chúng tôi, phản hồi thường trong 1-2 giờ làm việc.", icon: Mail, accent: "bg-red-600" },
  { title: "Hotline", description: "Hỗ trợ qua điện thoại mọi ngày trong tuần với đội ngũ chuyên nghiệp.", icon: Phone, accent: "bg-slate-700" },
  { title: "Trung tâm hỗ trợ", description: "Địa chỉ cửa hàng và kho giúp bạn đến trực tiếp nếu cần.", icon: MapPin, accent: "bg-indigo-600" },
  { title: "Giờ làm việc", description: "Hoạt động 9h - 21h mỗi ngày, kể cả cuối tuần và ngày lễ.", icon: Clock3, accent: "bg-cyan-600" },
  { title: "Chat trực tiếp", description: "Trò chuyện nhanh qua chat nội bộ để giải đáp thắc mắc tức thì.", icon: MessageCircle, accent: "bg-amber-500" },
];

export default function Page() {
  return (
    <InfoPage
      title="Liên hệ hỗ trợ"
      subtitle="Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn trong mọi vấn đề mua sắm."
      cards={cards}
    >
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Chúng tôi ở đây để giúp bạn</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">Nếu bạn cần hỗ trợ về đơn hàng, sản phẩm, kỹ thuật hoặc bảo hành, hãy chọn một trong các kênh dưới đây để liên hệ.</p>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Hotline</p>
              <p className="mt-2 text-sm text-slate-600">1900 1234</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Email</p>
              <p className="mt-2 text-sm text-slate-600">support@smarthub.vn</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Địa chỉ</p>
              <p className="mt-2 text-sm text-slate-600">123 Đường Công Nghệ, Quận 1, TP.HCM</p>
            </div>
          </div>
          <div className="mt-8 rounded-xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Thời gian phản hồi</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Đội ngũ hỗ trợ phản hồi trong vòng 1-2 giờ làm việc. Với yêu cầu gấp, sử dụng hotline để được ưu tiên xử lý.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-red-50 p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Gửi tin nhắn ngay</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">Chúng tôi sẽ phản hồi nhanh nhất có thể trong giờ hành chính.</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Chat trực tuyến</p>
              <p className="mt-2 text-sm text-slate-600">Mở hộp chat ở góc phải để trò chuyện với nhân viên.</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Gọi lại cho tôi</p>
              <p className="mt-2 text-sm text-slate-600">Đăng ký để nhân viên liên hệ lại theo thời gian bạn muốn.</p>
            </div>
          </div>
        </div>
      </div>
    </InfoPage>
  );
}
