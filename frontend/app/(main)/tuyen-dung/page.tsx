"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, ChevronDown, GraduationCap, TrendingUp, HeartHandshake, Wallet } from "lucide-react";

const benefits = [
  { label: "Lương cạnh tranh", icon: Wallet },
  { label: "Đào tạo chuyên sâu", icon: GraduationCap },
  { label: "Lộ trình thăng tiến", icon: TrendingUp },
  { label: "Bảo hiểm đầy đủ", icon: HeartHandshake },
];

const jobs = [
  {
    title: "Nhân viên bán hàng",
    location: "Hà Nội, TP.HCM, Đà Nẵng",
    type: "Toàn thời gian",
    desc: "Tư vấn, giới thiệu sản phẩm và chăm sóc khách hàng tại cửa hàng.",
    requirements: ["Tốt nghiệp THPT trở lên", "Giao tiếp tốt, yêu thích công nghệ", "Ưu tiên có kinh nghiệm bán lẻ"],
  },
  {
    title: "Kỹ thuật viên sửa chữa",
    location: "Hà Nội, TP.HCM",
    type: "Toàn thời gian",
    desc: "Kiểm tra, sửa chữa và bảo hành điện thoại, laptop tại trung tâm dịch vụ.",
    requirements: ["Có chứng chỉ/kinh nghiệm sửa chữa thiết bị điện tử", "Cẩn thận, có trách nhiệm", "Ưu tiên biết sửa cả phần cứng và phần mềm"],
  },
  {
    title: "Chuyên viên marketing",
    location: "Hà Nội",
    type: "Toàn thời gian",
    desc: "Lên kế hoạch và triển khai chiến dịch marketing đa kênh cho hệ thống.",
    requirements: ["Tốt nghiệp Marketing/Truyền thông", "Thành thạo các nền tảng quảng cáo số", "Sáng tạo, chịu được áp lực công việc"],
  },
  {
    title: "Lập trình viên Frontend",
    location: "Hà Nội (Hybrid)",
    type: "Toàn thời gian",
    desc: "Phát triển và tối ưu trải nghiệm website thương mại điện tử SMARTHUB.",
    requirements: ["Thành thạo React/Next.js", "Hiểu biết về UX/UI cơ bản", "Đã từng làm dự án e-commerce là một lợi thế"],
  },
];

export default function Page() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="bg-white">
      {/* Header band */}
      <div className="bg-red-600 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-100">Tuyển dụng</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Gia nhập đội ngũ SMARTHUB</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-red-100 sm:text-base">
            Cùng xây dựng hệ thống bán lẻ công nghệ hàng đầu Việt Nam với một môi trường năng động và nhiều cơ hội phát triển.
          </p>
        </div>
      </div>

      {/* Benefits strip */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="-mt-8 grid grid-cols-2 gap-3 rounded-2xl bg-white p-5 shadow-xl ring-1 ring-gray-100 sm:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-2 px-2 py-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <b.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-600">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Job list (accordion) */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-xl font-bold text-slate-900">Vị trí đang tuyển ({jobs.length})</h2>
        <div className="mt-6 space-y-3">
          {jobs.map((job, i) => {
            const open = openIdx === i;
            return (
              <div key={job.title} className="overflow-hidden rounded-2xl border border-gray-100">
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <p className="text-sm leading-6 text-slate-600">{job.desc}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Yêu cầu</p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {job.requirements.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                    <Link
                      href="/lien-he"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Ứng tuyển ngay
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          Không tìm thấy vị trí phù hợp? Gửi CV của bạn về <span className="font-semibold text-slate-800">tuyendung@smarthub.vn</span>,
          chúng tôi sẽ liên hệ khi có vị trí thích hợp.
        </div>
      </div>
    </div>
  );
}
