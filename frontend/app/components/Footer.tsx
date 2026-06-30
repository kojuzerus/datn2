"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, Clock, ShieldCheck, Star, Store, CreditCard, Smartphone, Wallet } from "lucide-react";
import { FaFacebookF, FaYoutube, FaTiktok } from "react-icons/fa";
import { SiZalo, SiVisa, SiMastercard } from "react-icons/si";
import { BsCash, BsBank2 } from "react-icons/bs";
import Logo from "./Logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerCategories = [
    { href: "/sanpham?danh-muc=iphone-air", label: "iPhone Air" },
    { href: "/sanpham?danh-muc=iphone-17", label: "iPhone 17" },
    { href: "/sanpham?danh-muc=iphone-17-pro", label: "iPhone 17 Pro" },
    { href: "/sanpham?danh-muc=iphone-17-pro-max", label: "iPhone 17 Pro Max" },
    { href: "/sanpham?danh-muc=iphone-16-pro-max", label: "iPhone 16 Pro Max" },
    { href: "/sanpham?danh-muc=iphone-16", label: "iPhone 16" },
    { href: "/sanpham?danh-muc=iphone-cu", label: "iPhone cũ" },
    { href: "/sanpham?danh-muc=macbook-neo", label: "Macbook Neo" },
    { href: "/sanpham?danh-muc=dien-thoai", label: "Điện thoại" },
    { href: "/sanpham?danh-muc=dien-thoai-iphone", label: "Điện thoại iPhone" },
    { href: "/sanpham?danh-muc=xiaomi", label: "Xiaomi" },
    { href: "/sanpham?danh-muc=samsung-galaxy", label: "Điện thoại Samsung Galaxy" },
    { href: "/sanpham?danh-muc=oppo", label: "Điện thoại OPPO" },
    { href: "/sanpham?danh-muc=oppo-find-x9s", label: "OPPO Find X9s" },
    { href: "/sanpham?danh-muc=oppo-find-x9-ultra", label: "OPPO Find X9 Ultra" },
    { href: "/sanpham?danh-muc=laptop", label: "Laptop" },
    { href: "/sanpham?danh-muc=laptop-acer", label: "Laptop Acer" },
    { href: "/sanpham?danh-muc=laptop-dell", label: "Laptop Dell" },
    { href: "/sanpham?danh-muc=laptop-hp", label: "Laptop HP" },
    { href: "/sanpham?danh-muc=do-gia-dung", label: "Đồ gia dụng" },
    { href: "/sanpham?danh-muc=may-hut-bui", label: "Máy hút bụi gia đình" },
    { href: "/sanpham?danh-muc=build-pc", label: "Build PC" },
    { href: "/sanpham?danh-muc=tivi", label: "Tivi" },
    { href: "/sanpham?danh-muc=tivi-samsung", label: "Tivi Samsung" },
    { href: "/sanpham?danh-muc=tivi-sony", label: "Tivi Sony" },
    { href: "/sanpham?danh-muc=tivi-lg", label: "Tivi LG" },
    { href: "/sanpham?danh-muc=camera", label: "Camera" },
    { href: "/sanpham?danh-muc=tra-gop", label: "Trả góp" },
    { href: "/sanpham?danh-muc=xiaomi-17t", label: "Xiaomi 17T" },
  ];

  const categories = [
    { href: "/sanpham?danh-muc=dien-thoai", label: "Điện thoại" },
    { href: "/sanpham?danh-muc=laptop", label: "Laptop" },
    { href: "/sanpham?danh-muc=may-tinh-bang", label: "Máy tính bảng" },
    { href: "/sanpham?danh-muc=phu-kien", label: "Phụ kiện" },
    { href: "/sanpham?danh-muc=tai-nghe", label: "Tai nghe & Loa" },
    { href: "/sanpham?danh-muc=dong-ho", label: "Đồng hồ thông minh" },
    { href: "/sanpham?giam-gia=1", label: "Khuyến mãi 🔥" },
    { href: "/sanpham", label: "Trả góp 0%" },
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
      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3">
              <Logo />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              SMARTHUB cung cấp thiết bị công nghệ chính hãng với dịch vụ hỗ trợ mua hàng và bảo hành chuyên nghiệp.
            </p>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="font-semibold text-gray-900">Hotline hỗ trợ</div>
              <div>1800.2044</div>
              <div>1800.2063</div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {socials.map(({ label, href, icon: Icon, color, bg }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-red-400 hover:text-red-600"
                  title={label}
                >
                  <Icon size={16} style={{ color }} />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.2em] mb-5">Hỗ trợ</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              {support.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-red-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.2em] mb-5">Về chúng tôi</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              {about.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-red-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.2em] mb-4">Thanh toán</h4>
              <div className="grid grid-cols-3 gap-3">
                {payments.map(({ label, icon: Icon, color, bg }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2 text-[11px] font-medium"
                    style={{ background: bg, color }}
                  >
                    <Icon size={16} />
                    <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-sm p-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.2em] mb-5">Đăng ký nhận tin</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              Nhận mã giảm giá và tin khuyến mãi mới nhất từ SMARTHUB.
            </p>
            <div className="mt-6 space-y-4">
              <input
                type="email"
                placeholder="Nhập email"
                className="w-full rounded-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
              <button className="w-full rounded-sm bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                NHẬN NGAY
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div className="space-y-2 text-sm text-gray-600">
              <div>Công ty TNHH Thương Mại Tổng Hợp HTV</div>
              <div>GPDKKD: 0108075931 cấp tại Sở KH&ĐT TP. Hà Nội</div>
              <div>Địa chỉ: 543 Nguyễn Trãi, Thanh Liệt, Hà Nội</div>
              <div>Điện thoại: 024.7303.0119</div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="font-semibold text-gray-900">Danh mục nổi bật</div>
              <div className="flex flex-wrap gap-2">
                {footerCategories.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-100 hover:text-red-600 transition"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-[11px] text-gray-600">Đã thông báo Bộ Công Thương</span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-[11px] text-gray-600">Bảo vệ bởi DMCA.com</span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-[11px] text-gray-600">Copyright Protected</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
