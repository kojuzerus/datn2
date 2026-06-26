import InfoPage from "../../components/InfoPage";
import { Truck, MapPin, Clock3, ShieldCheck, CreditCard } from "lucide-react";

const cards = [
  { title: "Vận chuyển nhanh", description: "Giao hàng siêu tốc trong nội thành, hàng chuẩn hàng đẹp đến tay bạn.", icon: Truck, accent: "bg-cyan-600" },
  { title: "Miễn phí vận chuyển", description: "Áp dụng cho đơn hàng đủ điều kiện theo chương trình, xem chi tiết tại giỏ hàng.", icon: CreditCard, accent: "bg-amber-500" },
  { title: "Theo dõi đơn hàng", description: "Cập nhật trạng thái bằng tin nhắn SMS và thông báo trên ứng dụng ngay khi có thay đổi.", icon: Clock3, accent: "bg-red-600" },
  { title: "Giao hàng an toàn", description: "Sản phẩm được đóng gói cẩn thận và bảo vệ kỹ càng trong quá trình vận chuyển.", icon: ShieldCheck, accent: "bg-slate-700" },
  { title: "Giao đến mọi nơi", description: "Phục vụ giao hàng toàn quốc với nhiều lựa chọn đơn vị vận chuyển uy tín.", icon: MapPin, accent: "bg-indigo-600" },
];

export default function Page() {
  return (
    <InfoPage
      title="Chính sách vận chuyển"
      subtitle="Vận chuyển nhanh chóng, an toàn và linh hoạt cho mọi đơn hàng SmartHub."
      cards={cards}
    >
      <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Phí vận chuyển</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Phí vận chuyển được áp dụng theo khu vực và giá trị đơn hàng. Nhiều chương trình khuyến mãi miễn phí ship cho đơn hàng đạt điều kiện.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Vùng áp dụng</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Phục vụ giao hàng toàn quốc, ưu tiên giao nhanh tại các thành phố lớn và hỗ trợ các vùng ngoại tỉnh với thời gian khác nhau.</p>
          </div>
        </section>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Thời gian giao hàng</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Các đơn nội thành thường giao trong 1-2 ngày; khu vực ngoại tỉnh có thể kéo dài 3-5 ngày tùy đối tác vận chuyển.</p>
          </article>
          <article className="rounded-xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Đóng gói bảo vệ</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Sản phẩm được đóng gói bảo vệ cẩn thận bằng vật liệu chống sốc, bảo đảm an toàn trong suốt hành trình.</p>
          </article>
        </div>
      </div>
    </InfoPage>
  );
}
