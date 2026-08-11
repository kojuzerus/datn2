'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  X, Gift, ShieldCheck, RefreshCw, Truck, Percent,
  Smartphone, Laptop, Headphones, Tv, Package, Volume2, Bell,
} from 'lucide-react';

const PROMO_KEY = 'smarthub_promo_seen_v1';

const categories = [
  { icon: Smartphone, label: 'Điện Thoại', href: '/sanpham?danh-muc=dien-thoai' },
  { icon: Laptop,     label: 'Laptop',     href: '/sanpham?danh-muc=laptop' },
  { icon: Volume2,    label: 'Loa',        href: '/sanpham?danh-muc=loa' },
  { icon: Headphones, label: 'Tai Nghe',   href: '/sanpham?danh-muc=tai-nghe' },
  { icon: Package,    label: 'Phụ Kiện',   href: '/sanpham?danh-muc=phu-kien' },
  { icon: Tv,         label: 'Điện Máy',   href: '/sanpham?danh-muc=tivi' },
];

const benefits = [
  { icon: ShieldCheck, label: 'Sản phẩm\nchính hãng 100%' },
  { icon: RefreshCw,   label: 'Đổi trả\ndễ dàng 7 ngày' },
  { icon: Truck,       label: 'Bảo hành\nuy tín toàn diện' },
  { icon: Percent,     label: 'Ưu đãi\nhấp dẫn mỗi ngày' },
];

export default function PromoModal() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    if (!isHome) return;
    const today = new Date().toDateString();
    const seen = localStorage.getItem(PROMO_KEY);
    if (seen !== today) {
      const t = setTimeout(() => setShow(true), 900);
      return () => clearTimeout(t);
    }
  }, [isHome]);

  const close = () => {
    localStorage.setItem(PROMO_KEY, new Date().toDateString());
    setShow(false);
  };

  const reopen = () => {
    localStorage.removeItem(PROMO_KEY);
    setShow(true);
  };

  return (
    <>
      {/* ── Nút "Xem lại ưu đãi" — góc dưới trái, chỉ hiện ở trang chủ ── */}
      {isHome && !show && (
        <button
          onClick={reopen}
          className="fixed left-0 bottom-6 z-[9998] flex items-center gap-2 bg-white text-gray-700 text-xs font-semibold shadow-lg border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          style={{ borderRadius: "0 8px 8px 0", padding: "10px 14px 10px 10px" }}
        >
          <Gift className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>Xem lại ưu đãi</span>
        </button>
      )}

      {/* ── Modal overlay ── */}
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={close}
          />

          {/* Modal card */}
          <div
            className="relative w-full max-w-[400px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ animation: "fadeInScale 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            {/* ── Banner header ── */}
            <div
              className="relative overflow-hidden"
              style={{ background: "linear-gradient(140deg,#7f1d1d 0%,#dc2626 40%,#f97316 100%)" }}
            >
              {/* Confetti dots */}
              {[...Array(18)].map((_, i) => (
                <span
                  key={i}
                  className="absolute rounded-full pointer-events-none opacity-30"
                  style={{
                    width: `${4 + (i % 5) * 3}px`,
                    height: `${4 + (i % 5) * 3}px`,
                    left: `${(i * 17 + 5) % 92}%`,
                    top: `${(i * 23 + 8) % 85}%`,
                    background: ["#fde68a","#fbbf24","#ffffff","#fed7aa","#fca5a5"][i % 5],
                  }}
                />
              ))}

              {/* Close button */}
              <button
                onClick={close}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Brand */}
              <div className="relative z-10 flex justify-center pt-5 pb-1">
                <div className="bg-white/20 backdrop-blur-sm px-5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="text-yellow-300 font-black text-sm tracking-widest">SMART</span>
                  <span className="text-white font-black text-sm tracking-widest">HUB</span>
                </div>
              </div>

              {/* Main headline */}
              <div className="relative z-10 text-center px-4 pt-2 pb-3">
                <p className="text-white/90 text-[11px] font-bold uppercase tracking-[0.25em]">Ưu đãi cực đỉnh</p>
                <p
                  className="font-black uppercase leading-none mt-1"
                  style={{
                    fontSize: "clamp(2rem, 8vw, 2.6rem)",
                    color: "#fde68a",
                    textShadow: "0 3px 0 rgba(0,0,0,0.3), 0 6px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  RINH DEAL
                </p>
                <p
                  className="font-black uppercase leading-none"
                  style={{
                    fontSize: "clamp(1.5rem, 6vw, 2rem)",
                    color: "#ffffff",
                    textShadow: "0 2px 0 rgba(0,0,0,0.3)",
                  }}
                >
                  CỰC CHẤT
                </p>
                <div className="mt-2 inline-block bg-yellow-300/20 border border-yellow-300/40 rounded-full px-4 py-1">
                  <p className="text-yellow-200 text-xs font-bold tracking-wide">🔥 SĂN NGAY KẺO LỠ!</p>
                </div>
              </div>

              {/* Voucher + Freeship + Góp 0% */}
              <div className="relative z-10 flex gap-2.5 px-4 pb-4">
                <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-lg">
                  <p className="text-red-500 text-[10px] font-bold uppercase">Voucher giảm đến</p>
                  <p className="text-red-600 font-black text-2xl leading-tight">500K</p>
                  <p className="text-red-400 text-[9px] font-semibold">Cho đơn từ 5 triệu</p>
                </div>
                <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-lg">
                  <Truck className="w-6 h-6 text-red-500 mx-auto" />
                  <p className="text-red-600 font-black text-sm leading-tight mt-1">FREESHIP</p>
                  <p className="text-red-400 text-[10px] font-bold">TOÀN QUỐC</p>
                </div>
                <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-lg">
                  <p className="text-orange-500 text-[10px] font-bold uppercase">Trả góp</p>
                  <p className="text-orange-600 font-black text-2xl leading-tight">0%</p>
                  <p className="text-orange-400 text-[9px] font-semibold">Phí 0đ, duyệt nhanh</p>
                </div>
              </div>

              {/* Benefits strip */}
              <div className="relative z-10 grid grid-cols-4 gap-1.5 px-4 pb-4">
                {benefits.map((b) => (
                  <div key={b.label} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-2 text-center">
                    <b.icon className="w-4 h-4 text-white mx-auto" />
                    <p className="text-white text-[8px] font-semibold mt-1 leading-tight whitespace-pre-line">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Categories ── */}
            <div className="bg-white px-4 pt-3 pb-2">
              <div className="grid grid-cols-6 gap-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    onClick={close}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-11 h-11 bg-gray-50 group-hover:bg-red-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:border-red-100 transition-colors">
                      <cat.icon className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" />
                    </div>
                    <span className="text-[9px] text-gray-500 group-hover:text-red-500 text-center leading-tight font-medium transition-colors">
                      {cat.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="bg-white px-4 pb-5">
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-3">
                <Bell className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <p className="text-orange-700 text-[10px] font-semibold leading-tight">
                  Chương trình có thời hạn – Số lượng ưu đãi có hạn!
                </p>
              </div>
              <Link href="/sanpham" onClick={close}>
                <button
                  className="w-full py-3.5 rounded-xl font-black text-white text-base flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  style={{
                    background: "linear-gradient(90deg,#f97316 0%,#dc2626 100%)",
                    boxShadow: "0 4px 18px rgba(220,38,38,0.40)",
                  }}
                >
                  <Gift className="w-5 h-5" />
                  MUA NGAY – GIÁ TỐT NHẤT!
                </button>
              </Link>
              <button
                onClick={close}
                className="w-full mt-2.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Bỏ qua, xem sau
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
