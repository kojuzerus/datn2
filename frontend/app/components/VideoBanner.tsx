"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";

// Đặt file video vào /public/videos/hero.mp4
// Nếu không có file local, tự động dùng video CDN làm fallback
const VIDEO_LOCAL = "/videos/hero.mp4";
const VIDEO_CDN =
  "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-holding-a-smart-phone-4697-large.mp4";
const POSTER =
  "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1920&q=90&auto=format";

export default function VideoBanner() {
  const [muted, setMuted] = useState(true);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Fade-in khi component mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Parallax nhẹ: video dịch chuyển chậm hơn tốc độ cuộn
  useEffect(() => {
    const onScroll = () => {
      if (!videoRef.current || !sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      // Chỉ tính khi banner còn trong viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const scrolled = -rect.top; // px đã cuộn qua banner
      videoRef.current.style.transform = `translateY(${scrolled * 0.28}px)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ height: "80vh", minHeight: 480 }}
    >
      {/* ── Video nền toàn bộ chiều rộng ───────────────────────────── */}
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="auto"
        poster={POSTER}
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ top: "-10%", height: "120%" }} // dư ra để parallax không lộ viền
      >
        {/* Thử file local trước, fallback CDN nếu không có */}
        <source src={VIDEO_LOCAL} type="video/mp4" />
        <source src={VIDEO_CDN} type="video/mp4" />
      </video>

      {/* ── Lớp overlay đen 40% giúp chữ dễ đọc ──────────────────── */}
      <div className="absolute inset-0 bg-black/40" />

      {/* ── Nội dung căn giữa với hiệu ứng fade-in ────────────────── */}
      <div
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 md:px-12"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(28px)",
          transition: "opacity 0.9s ease, transform 0.9s ease",
        }}
      >
        {/* Nhãn nhỏ phía trên */}
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 mb-4">
          Công nghệ · Chất lượng · Uy tín
        </p>

        {/* Tiêu đề chính */}
        <h1
          className="font-black text-white leading-tight tracking-tight mb-5 max-w-4xl"
          style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)" }}
        >
          Khám phá sản phẩm của chúng tôi
        </h1>

        {/* Mô tả ngắn */}
        <p
          className="text-white/75 max-w-2xl mb-10 leading-relaxed"
          style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.1rem)" }}
        >
          Trải nghiệm công nghệ đỉnh cao với bộ sưu tập sản phẩm mới nhất —&nbsp;
          chất lượng chính hãng, bảo hành toàn quốc, giao hàng trong 2 giờ.
        </p>

        {/* Hai nút CTA */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Nút chính "Mua ngay" */}
          <Link
            href="/sanpham"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-sm text-white no-underline transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
              boxShadow: "0 8px 28px rgba(220,38,38,0.45)",
            }}
          >
            Mua ngay
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Nút phụ "Xem thêm" */}
          <Link
            href="/sanpham"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-sm text-white no-underline border-2 border-white/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white/10"
          >
            Xem thêm
            <ArrowRight className="w-4 h-4 opacity-60 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ── Nút bật / tắt âm thanh ─────────────────────────────────── */}
      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute bottom-5 right-5 z-20 w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:scale-110 hover:bg-white/20"
        style={{
          background: "rgba(255,255,255,0.10)",
          borderColor: "rgba(255,255,255,0.28)",
          color: "#fff",
          backdropFilter: "blur(8px)",
        }}
        title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
        aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
      >
        {muted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>

      {/* ── Gradient đáy mờ dần để kết nối với phần bên dưới ──────── */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)",
        }}
      />
    </section>
  );
}
