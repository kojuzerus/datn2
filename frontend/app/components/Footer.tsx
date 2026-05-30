"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, Clock, ShieldCheck, Star, Store, CreditCard, Smartphone, Wallet } from "lucide-react";
import { FaFacebookF, FaYoutube, FaTiktok } from "react-icons/fa";
import { SiZalo, SiVisa, SiMastercard } from "react-icons/si";
import { BsCash, BsBank2 } from "react-icons/bs";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const categories = [
    { href: "/sanpham?danh-muc=dien-thoai", label: "Điện thoại" },
    { href: "/sanpham?danh-muc=laptop", label: "Laptop" },
    { href: "/sanpham?danh-muc=may-tinh-bang", label: "Máy tính bảng" },
    { href: "/sanpham?danh-muc=phu-kien", label: "Phụ kiện" },
    { href: "/sanpham?danh-muc=tai-nghe", label: "Tai nghe & Loa" },
    { href: "/sanpham?danh-muc=dong-ho", label: "Đồng hồ thông minh" },
    { href: "/khuyen-mai", label: "Khuyến mãi 🔥" },
    { href: "/tra-gop", label: "Trả góp 0%" },
  ];

  const support = [
    { href: "/huong-dan-mua-hang", label: "Hướng dẫn mua hàng" },
    { href: "/chinh-sach-doi-tra", label: "Chính sách đổi trả" },
    { href: "/chinh-sach-bao-hanh", label: "Chính sách bảo hành" },
    { href: "/chinh-sach-van-chuyen", label: "Chính sách vận chuyển" },
    { href: "/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
    { href: "/tra-cuu-don-hang", label: "Tra cứu đơn hàng" },
    { href: "/lien-he", label: "Liên hệ hỗ trợ" },
  ];

  const about = [
    { href: "/gioi-thieu", label: "Về SMARTHUB" },
    { href: "/he-thong-cua-hang", label: "Hệ thống cửa hàng" },
    { href: "/tuyen-dung", label: "Tuyển dụng" },
    { href: "/tin-tuc", label: "Tin tức & Công nghệ" },
    { href: "/doi-tac", label: "Đối tác thương hiệu" },
  ];

  const payments = [
    { label: "Visa / Mastercard", icon: SiVisa, color: "#1A1F71", bg: "#EEF2FF" },
    { label: "Chuyển khoản", icon: BsBank2, color: "#0369a1", bg: "#e0f2fe" },
    { label: "Tiền mặt", icon: BsCash, color: "#15803d", bg: "#dcfce7" },
    { label: "MoMo", icon: Smartphone, color: "#ae2070", bg: "#fdf2f8" },
    { label: "ZaloPay", icon: Wallet, color: "#0068ff", bg: "#eff6ff" },
    { label: "VNPay", icon: CreditCard, color: "#e53e3e", bg: "#fff5f5" },
  ];

  const socials = [
    { label: "Facebook", href: "https://facebook.com", icon: FaFacebookF, color: "#1877F2", bg: "#EBF5FF" },
    { label: "Zalo", href: "https://zalo.me", icon: SiZalo, color: "#0068FF", bg: "#EBF5FF" },
    { label: "YouTube", href: "https://youtube.com", icon: FaYoutube, color: "#FF0000", bg: "#FFF1F1" },
    { label: "TikTok", href: "https://tiktok.com", icon: FaTiktok, color: "#010101", bg: "#F5F5F5" },
  ];

  const stats = [
    { value: "500K+", label: "Khách hàng" },
    { value: "50+", label: "Cửa hàng" },
    { value: "10K+", label: "Sản phẩm" },
    { value: "99%", label: "Hài lòng" },
  ];

  return (
    <footer className="w-full bg-white border-t border-gray-200">

      {/* Stats bar */}
      <div className="bg-red-600">
        <div className="max-w-screen-xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-red-500">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center px-4">
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-red-200 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Email signup */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-800 text-sm">Nhận ưu đãi từ SMARTHUB</p>
            <p className="text-xs text-gray-400 mt-0.5">Voucher 200K cho đơn đầu tiên khi đăng ký email</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="Email của bạn..."
              className="flex-1 sm:w-64 bg-white border border-gray-200 text-gray-700 placeholder-gray-400 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-red-400 transition-colors"
            />
            <button className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex-shrink-0">
              Đăng ký
            </button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1 — Brand + Contact */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-lg transition-transform group-hover:scale-105">
                💻
              </div>
              <div className="leading-none">
                <div className="text-lg font-bold text-gray-900 tracking-tight">
                  SMART<span className="text-red-600">HUB</span>
                </div>
                <div className="text-[9px] text-gray-400 tracking-[2px] mt-0.5">CÔNG NGHỆ</div>
              </div>
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              Hệ thống bán lẻ điện tử hàng đầu Việt Nam. Hàng chính hãng, giá tốt nhất, giao hàng toàn quốc.
            </p>

            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div>
                  <span className="font-medium">1800 9999</span>
                  <span className="text-xs text-gray-400 ml-2">Miễn phí • 8–22h</span>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>hotro@smarthub.vn</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>8:00 – 22:00 tất cả các ngày</span>
              </li>
            </ul>
          </div>

          {/* Col 2 — Danh mục */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Danh mục sản phẩm
            </h4>
            <ul className="space-y-2">
              {categories.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Hỗ trợ + Về chúng tôi */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-2 mb-6">
              {support.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Về chúng tôi
            </h4>
            <ul className="space-y-2">
              {about.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Mạng xã hội + Thanh toán + Chứng nhận */}
          <div>

            {/* Kết nối */}
            <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Kết nối</h4>
            <div className="flex gap-2 mb-6">
              {socials.map(({ label, href, icon: Icon, color, bg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="w-9 h-9 rounded-lg border border-gray-100 flex items-center justify-center transition-all hover:scale-110 hover:shadow-sm"
                  style={{ background: bg, color }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>

            {/* Thanh toán */}
            <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">Thanh toán</h4>
            <div className="grid grid-cols-2 gap-1.5 mb-6">
              {payments.map(({ label, icon: Icon, color, bg }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 rounded-lg border border-gray-100"
                  style={{ background: bg, color }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>

            {/* Chứng nhận */}
            <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">Chứng nhận</h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                Bộ Công Thương xác nhận
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Store className="w-4 h-4 text-blue-500 flex-shrink-0" />
                SSL Secured
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                4.9/5 trên Google Reviews
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            © {currentYear} <span className="font-medium text-gray-600">SMARTHUB</span>. Tất cả quyền được bảo lưu. GPKD: 0123456789 — Sở KH&ĐT TP.HCM
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-400">Hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </div>

    </footer>
  );
}