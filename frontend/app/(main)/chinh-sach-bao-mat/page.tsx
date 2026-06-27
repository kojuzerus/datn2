import InfoPage from "../../components/InfoPage";
import { ShieldCheck, Lock, FolderKey, MessageCircle, CreditCard } from "lucide-react";

const cards = [
  { title: "Dữ liệu bảo mật", description: "Thông tin cá nhân và đơn hàng của bạn được mã hóa và bảo vệ nghiêm ngặt.", icon: Lock, accent: "bg-slate-700" },
  { title: "Bảo mật tài khoản", description: "Mật khẩu và thông tin cá nhân được giữ an toàn với các cơ chế xác thực và mã hóa dữ liệu.", icon: FolderKey, accent: "bg-indigo-600" },
  { title: "Giao dịch an toàn", description: "Thanh toán trực tuyến được bảo mật bằng nhiều lớp kiểm tra.", icon: CreditCard, accent: "bg-sky-600" },
  { title: "Quyền riêng tư", description: "Cam kết không chia sẻ dữ liệu cá nhân cho bên thứ ba trái phép.", icon: ShieldCheck, accent: "bg-emerald-600" },
  { title: "Kiểm soát truy cập", description: "Chỉ có bạn và đội ngũ hỗ trợ mới truy cập thông tin khi cần thiết.", icon: FolderKey, accent: "bg-purple-600" },
  { title: "Hỗ trợ an tâm", description: "Hỗ trợ báo cáo sự cố bảo mật và giải đáp mọi thắc mắc của bạn.", icon: MessageCircle, accent: "bg-red-600" },
];

export default function Page() {
  return (
    <InfoPage
      title="Chính sách bảo mật"
      subtitle="Bảo mật thông tin khách hàng là ưu tiên hàng đầu của SmartHub."
      cards={cards}
    >
      <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Cam kết bảo mật</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">Chúng tôi áp dụng các biện pháp kỹ thuật và quy định nghiêm ngặt để bảo vệ dữ liệu khách hàng. Mọi hoạt động truy cập đều được theo dõi và chỉ dùng cho mục đích xử lý đơn hàng.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Mật khẩu và tài khoản</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Không chia sẻ mật khẩu và luôn đăng xuất khi sử dụng thiết bị công cộng. Chúng tôi không lưu trữ mật khẩu dạng văn bản.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Quyền riêng tư</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Chỉ sử dụng thông tin cá nhân để xử lý đơn hàng, chăm sóc khách hàng và cải thiện dịch vụ. Bạn có quyền yêu cầu xóa dữ liệu theo quy định hiện hành.</p>
          </div>
        </div>
        <div className="mt-8 rounded-xl bg-slate-50 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Phạm vi dữ liệu thu thập</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">Chúng tôi chỉ thu thập dữ liệu cần thiết như tên, số điện thoại, địa chỉ giao hàng và thông tin thanh toán để hoàn thành đơn hàng và hỗ trợ dịch vụ.</p>
        </div>
      </div>
    </InfoPage>
  );
}
