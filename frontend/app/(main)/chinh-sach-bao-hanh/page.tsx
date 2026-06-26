import InfoPage from "../../components/InfoPage";
import { ShieldCheck, Award, Toolbox, Clock3, FileText } from "lucide-react";

const cards = [
  { title: "Bảo hành chính hãng", description: "Cam kết bảo hành theo tiêu chuẩn nhà sản xuất với linh kiện chính hãng.", icon: ShieldCheck, accent: "bg-emerald-600" },
  { title: "Thời gian cụ thể", description: "Bảo hành từ 12 đến 24 tháng tùy theo sản phẩm và hãng.", icon: Clock3, accent: "bg-sky-600" },
  { title: "Dịch vụ chuyên nghiệp", description: "Kỹ thuật viên giàu kinh nghiệm xử lý bảo hành nhanh và chính xác.", icon: Toolbox, accent: "bg-purple-600" },
  { title: "Cam kết chất lượng", description: "Mọi sản phẩm sau bảo hành đều được kiểm tra kỹ và trả lại trong tình trạng hoàn chỉnh.", icon: Award, accent: "bg-red-600" },
  { title: "Hướng dẫn rõ ràng", description: "Thông tin bảo hành minh bạch, dễ hiểu và dễ tra cứu cho khách hàng.", icon: FileText, accent: "bg-amber-500" },
];

export default function Page() {
  return (
    <InfoPage
      title="Chính sách bảo hành"
      subtitle="Bảo hành an tâm cho sản phẩm công nghệ chính hãng, nhanh chóng và minh bạch."
      cards={cards}
    >
      <div className="mt-12 space-y-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Phạm vi bảo hành</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">Bao gồm lỗi kỹ thuật do nhà sản xuất, linh kiện, bo mạch và các khu vực do hãng quy định. Không áp dụng cho hư hỏng do người dùng như rơi vỡ, vào nước, hoặc tự ý sửa chữa.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Cách gửi sản phẩm bảo hành</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">Liên hệ CSKH để nhận mã bảo hành và hướng dẫn gửi sản phẩm về trung tâm. Bạn có thể giao hàng trực tiếp hoặc sử dụng dịch vụ vận chuyển đối tác.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Bảo quản trước khi gửi</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">Đóng gói sản phẩm cẩn thận, giữ nguyên phụ kiện và bộ nguồn. Ảnh chụp tình trạng ban đầu giúp ghi nhận nhanh nếu có tranh chấp trong quá trình vận chuyển.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Lưu ý quan trọng</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-slate-600">
            <li>Giữ lại hóa đơn và phiếu bảo hành để thuận tiện khi đổi trả.</li>
            <li>Không tự ý tháo lắp hoặc sửa chữa nếu muốn hưởng chế độ bảo hành.</li>
            <li>Một số linh kiện như pin, sạc và tai nghe có thể có chính sách bảo hành riêng.</li>
          </ul>
        </section>
      </div>
    </InfoPage>
  );
}
