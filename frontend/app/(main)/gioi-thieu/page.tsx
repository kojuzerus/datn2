import Link from "next/link";
import { Rocket, ShieldCheck, HeartHandshake, Award, Quote } from "lucide-react";

const stats = [
  { value: "2020", label: "Năm thành lập" },
  { value: "500K+", label: "Khách hàng" },
  { value: "50+", label: "Cửa hàng" },
  { value: "63", label: "Tỉnh thành phục vụ" },
];

const timeline = [
  { year: "2020", title: "Khởi đầu", desc: "Mở cửa hàng đầu tiên tại Hà Nội, chuyên điện thoại và laptop chính hãng." },
  { year: "2022", title: "Mở rộng", desc: "Phát triển lên 20+ cửa hàng tại các thành phố lớn, ra mắt website mua sắm trực tuyến." },
  { year: "2024", title: "Bứt phá", desc: "Vượt mốc 500.000 khách hàng, mở rộng ngành hàng phụ kiện, gia dụng và gaming gear." },
  { year: "2026", title: "Hiện tại", desc: "Hệ thống 50+ cửa hàng trên toàn quốc, hướng tới trở thành nhà bán lẻ công nghệ #1 Việt Nam." },
];

const values = [
  { title: "Chính hãng", desc: "Mọi sản phẩm có hóa đơn, phiếu bảo hành rõ ràng.", icon: ShieldCheck },
  { title: "Minh bạch", desc: "Giá niêm yết công khai, không bán giá ảo.", icon: Award },
  { title: "Tận tâm", desc: "Đồng hành cùng khách hàng trước và sau khi mua.", icon: HeartHandshake },
];

export default function Page() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-600 to-red-800 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-white/10" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em]">
            <Rocket className="h-3.5 w-3.5" /> Về SMARTHUB
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Công nghệ chính hãng, <br className="hidden sm:block" /> đến tay bạn nhanh nhất
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-red-100 sm:text-lg">
            SMARTHUB là hệ thống bán lẻ thiết bị công nghệ chính hãng, đồng hành cùng khách hàng Việt Nam từ năm 2020.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mx-auto -mt-10 max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-xl shadow-red-900/10 ring-1 ring-gray-100 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-red-600 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Hành trình phát triển</h2>
        <div className="mt-12 space-y-10 border-l-2 border-red-100 pl-8">
          {timeline.map((t) => (
            <div key={t.year} className="relative">
              <span className="absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-4 ring-white">
                •
              </span>
              <p className="text-sm font-bold uppercase tracking-wide text-red-600">{t.year}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{t.title}</h3>
              <p className="mt-1.5 text-sm leading-7 text-slate-600">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div className="bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Quote className="mx-auto h-8 w-8 text-red-300" />
          <p className="mt-4 text-lg font-medium leading-8 text-slate-700 sm:text-xl">
            “Chúng tôi tin rằng mọi người đều xứng đáng tiếp cận công nghệ tốt với mức giá hợp lý và dịch vụ đáng tin cậy.”
          </p>
          <p className="mt-3 text-sm text-slate-400">— Ban lãnh đạo SMARTHUB</p>
        </div>
      </div>

      {/* Values */}
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Giá trị cốt lõi</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-gray-100 p-6 text-center transition hover:shadow-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{v.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{v.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/sanpham"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}
