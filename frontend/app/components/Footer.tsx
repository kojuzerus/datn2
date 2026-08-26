"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, ShieldCheck, Star, Store, Loader2 } from "lucide-react";
import { FaFacebookF, FaYoutube, FaTiktok } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import Logo from "./Logo";
import { toastSuccess, toastError } from "../utils/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // ── Đăng ký nhận tin ──
  const [newsletterEmail, setNewsletterEmail]     = useState("");
  const [subscribing, setSubscribing]             = useState(false);

  const handleSubscribe = async () => {
    const email = newsletterEmail.trim();
    if (!email) return toastError("Vui lòng nhập email!");
    setSubscribing(true);
    try {
      const res  = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        toastSuccess(json.message);
        setNewsletterEmail("");
      } else {
        toastError(json.message || "Có lỗi xảy ra, thử lại nhé!");
      }
    } catch {
      toastError("Không thể kết nối đến máy chủ!");
    } finally {
      setSubscribing(false);
    }
  };

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

  const paymentBadges: { label: string; node: React.ReactNode }[] = [
    {
      label: "Apple Pay",
      node: (
        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors h-9">
          <svg viewBox="0 0 24 24" height="16" fill="currentColor" className="text-gray-900">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span className="text-[12px] font-semibold text-gray-900 tracking-tight">Pay</span>
        </div>
      ),
    },
    {
      label: "VNPAY",
      node: (
        <div className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors h-9">
          <span className="font-black text-[13px] tracking-tight" style={{ color: "#e53e3e" }}>VN</span>
          <span className="font-black text-[13px] tracking-tight" style={{ color: "#0066cc" }}>PAY</span>
        </div>
      ),
    },
    {
      label: "MoMo",
      node: (
        <div className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors h-9">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#ae2070" }}>
            <span className="text-white font-black" style={{ fontSize: "8px" }}>M</span>
          </div>
          <span className="font-black text-[12px]" style={{ color: "#ae2070" }}>momo</span>
        </div>
      ),
    },
    {
      label: "OnePay",
      node: (
        <div className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors h-9">
          <span className="font-black text-[11px]" style={{ color: "#003087" }}>One</span>
          <span className="font-black text-[11px]" style={{ color: "#e53e3e" }}>Pay</span>
        </div>
      ),
    },
    {
      label: "Kredivo",
      node: (
        <div className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors h-9">
          <span className="font-black text-[12px] italic" style={{ color: "#e8360a" }}>Kre</span>
          <span className="font-black text-[12px] italic" style={{ color: "#111" }}>divo</span>
        </div>
      ),
    },
    {
      label: "ZaloPay",
      node: (
        <div className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors h-9">
          <span className="font-black text-[11px]" style={{ color: "#0068ff" }}>Zalo</span>
          <span className="font-black text-[11px]" style={{ color: "#00aaff" }}>Pay</span>
        </div>
      ),
    },
    {
      label: "Fundiin",
      node: (
        <div className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors h-9">
          <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ background: "#00b14f" }}>
            <span className="text-white font-black" style={{ fontSize: "7px" }}>F</span>
          </div>
          <span className="font-bold text-[11px] text-gray-800">Fundiin</span>
        </div>
      ),
    },
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
    <footer id="site-footer" className="w-full bg-white border-t border-gray-200">
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
              <div className="flex flex-wrap gap-2">
                {paymentBadges.map(({ label, node }) => (
                  <div key={label} title={label}>{node}</div>
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
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubscribe(); }}
                disabled={subscribing}
                className="w-full rounded-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
              />
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full flex items-center justify-center gap-2 rounded-sm bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {subscribing ? "Đang gửi..." : "NHẬN NGAY"}
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
