"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ShoppingBag, Shield, CheckCircle2,
} from "lucide-react";

/* ── Spec callout card ─────────────────────────────────────── */
function SpecCard({
  title,
  items,
  align = "left",
}: {
  title: string;
  items: string[];
  align?: "left" | "right";
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #efefef",
        borderRadius: 14,
        padding: "10px 14px",
        boxShadow:
          "0 4px 18px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        textAlign: align,
        maxWidth: 175,
        minWidth: 148,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#111111",
          marginBottom: 5,
          lineHeight: 1.3,
        }}
      >
        {title}
      </p>
      {items.map((item) => (
        <p
          key={item}
          style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.55 }}
        >
          {item}
        </p>
      ))}
    </div>
  );
}

/* ── Callout data — vị trí SVG tính theo % của phone-panel ── */
/*
  Ảnh iPhone 17 Pro PNG: back phone (trái) + front phone (phải) xếp chồng
  x/y là toạ độ chấm đỏ trên ảnh (% của container phone-panel)
  cx/cy là góc card gần chấm nhất
*/
const CALLOUTS = [
  {
    id: "camera",
    title: "Triple Camera System",
    items: ["Main: 200MP f/1.8 OIS", "Ultra-wide: 48MP", "Telephoto: 12MP 5×"],
    align: "left" as const,
    // vị trí chấm đỏ trên phone (camera module – top-left của back phone)
    dotX: 43, dotY: 19,
    // vị trí card (left side)
    cardTop: "12%", cardLeft: "2%",
    // điểm neo của đường kẻ tính từ mép card đến chấm đỏ
    lineX1: 27, lineY1: 20,
  },
  {
    id: "chip",
    title: "Chip A19 Bionic",
    items: ["CPU 6-core thế hệ mới", "GPU 6-core", "Neural Engine 16-core"],
    align: "left" as const,
    dotX: 40, dotY: 52,
    cardTop: "46%", cardLeft: "2%",
    lineX1: 27, lineY1: 53,
  },
  {
    id: "screen",
    title: "Super Retina XDR 6.9\"",
    items: ["OLED ProMotion 120Hz", "2868 × 1320 px", "Always-On Display"],
    align: "right" as const,
    dotX: 63, dotY: 40,
    cardTop: "20%", cardLeft: undefined,
    cardRight: "2%",
    lineX1: 75, lineY1: 30,
  },
  {
    id: "titanium",
    title: "Titanium Deep Blue",
    items: ["IP68 · 6m · 30 phút", "Khung titan hàng không", "MagSafe 25W"],
    align: "right" as const,
    dotX: 55, dotY: 73,
    cardTop: "60%", cardLeft: undefined,
    cardRight: "2%",
    lineX1: 76, lineY1: 67,
  },
] as const;

/* ── Main component ────────────────────────────────────────── */
export default function HeroBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        height: "clamp(580px, 88vh, 920px)",
        background: "#f8f8f8",
      }}
    >
      {/* Wash trắng trung tâm */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 62% 50%, #ffffff 25%, rgba(245,244,242,0.55) 100%)",
        }}
      />

      {/* ── Layout ──────────────────────────────────────────────── */}
      <div
        className="relative z-10 h-full flex items-center"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 0.7s ease",
        }}
      >
        {/* ━━━ LEFT: Text ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className="flex-shrink-0 pl-6 sm:pl-10 lg:pl-16 xl:pl-22 pr-4"
          style={{
            width: "min(40%, 500px)",
            transform: ready ? "translateX(0)" : "translateX(-28px)",
            transition: "transform 0.9s cubic-bezier(0.23,1,0.32,1) 0.1s",
          }}
        >
          {/* Label */}
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.28em] mb-6"
            style={{ color: "#dc2626" }}
          >
            Ra mắt độc quyền · 2025
          </p>

          {/* Headline */}
          <h1
            className="font-black tracking-tight leading-[0.88]"
            style={{
              fontSize: "clamp(2.4rem, 4.6vw, 4.4rem)",
              color: "#111111",
              whiteSpace: "nowrap",
              marginBottom: "0.15em",
            }}
          >
            iPhone 17
          </h1>
          <h1
            className="font-black tracking-tight leading-[1] mb-6"
            style={{
              fontSize: "clamp(2rem, 3.9vw, 3.8rem)",
              color: "#111111",
              whiteSpace: "nowrap",
            }}
          >
            Pro Max
          </h1>

          {/* Mô tả */}
          <p
            className="leading-relaxed mb-8"
            style={{
              fontSize: "clamp(0.88rem, 1.25vw, 1rem)",
              color: "#6b7280",
            }}
          >
            Titanium Deep Blue. Camera 200MP kép đỉnh.
            <br />
            Chip A19 Bionic — thế hệ hiệu năng mới nhất.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-3 flex-wrap mb-10">
            <Link
              href="/sanpham?tu-khoa=iPhone%2017%20Pro%20Max"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm text-white no-underline transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: "#dc2626",
                boxShadow: "0 4px 14px rgba(220,38,38,0.28)",
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              Đặt trước ngay
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/sanpham?tu-khoa=iPhone"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm no-underline transition-all duration-300 hover:-translate-y-0.5"
              style={{
                color: "#374151",
                border: "1.5px solid #d1d5db",
                background: "#ffffff",
              }}
            >
              Xem tất cả iPhone
              <ArrowRight className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Giá + trust */}
          <div className="flex items-center gap-5 flex-wrap">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                style={{ color: "#9ca3af" }}
              >
                Giá từ
              </p>
              <p
                className="font-black leading-none"
                style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)", color: "#111111" }}
              >
                34.990.000
                <span className="text-sm font-semibold ml-1" style={{ color: "#6b7280" }}>đ</span>
              </p>
            </div>
            <div className="h-8 w-px" style={{ background: "#e5e7eb" }} />
            <div className="flex flex-col gap-2">
              {[
                { icon: Shield,        label: "Bảo hành 12 tháng Apple" },
                { icon: CheckCircle2,  label: "Trả góp 0% — 24 tháng" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9ca3af" }} />
                  <span className="text-xs font-medium" style={{ color: "#6b7280" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ━━━ RIGHT: Phone panel + spec callouts ━━━━━━━━━━━━━━━━ */}
        <div
          className="flex-1 relative h-full"
          style={{
            transform: ready
              ? "translateX(0) scale(1)"
              : "translateX(36px) scale(0.96)",
            transition: "transform 1.05s cubic-bezier(0.23,1,0.32,1) 0.12s",
          }}
        >
          {/* SVG connector lines + dots ─────────────────────────── */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%", zIndex: 18 }}
          >
            {CALLOUTS.map((c) => (
              <g key={c.id}>
                {/* Đường kẻ mờ */}
                <line
                  x1={`${c.lineX1}%`}
                  y1={`${c.lineY1}%`}
                  x2={`${c.dotX}%`}
                  y2={`${c.dotY}%`}
                  stroke="#d1d5db"
                  strokeWidth="1.2"
                  strokeDasharray="0"
                />
                {/* Vòng ngoài chấm (halo) */}
                <circle
                  cx={`${c.dotX}%`}
                  cy={`${c.dotY}%`}
                  r="5"
                  fill="rgba(220,38,38,0.12)"
                />
                {/* Chấm đỏ */}
                <circle
                  cx={`${c.dotX}%`}
                  cy={`${c.dotY}%`}
                  r="2.8"
                  fill="#dc2626"
                />
              </g>
            ))}
          </svg>

          {/* iPhone image — centered ─────────────────────────────── */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/banners/iphone-17-pro.png"
              alt="iPhone 17 Pro Max"
              style={{
                position: "relative",
                zIndex: 10,
                maxHeight: "clamp(380px, 68vh, 640px)",
                maxWidth: "68%",
                width: "auto",
                objectFit: "contain",
                filter:
                  "drop-shadow(0 36px 72px rgba(0,0,0,0.11)) drop-shadow(0 8px 20px rgba(0,0,0,0.07))",
                animation: "hero-phone-float 7s ease-in-out infinite",
              }}
            />
          </div>

          {/* Spec callout cards ─────────────────────────────────── */}
          {CALLOUTS.map((c, i) => (
            <div
              key={c.id}
              className="absolute hidden sm:block"
              style={{
                top: c.cardTop,
                left: "cardLeft" in c ? c.cardLeft : undefined,
                right: "cardRight" in c ? c.cardRight : undefined,
                zIndex: 20,
                opacity: 0,
                animation: `hero-callout-in 0.5s cubic-bezier(0.23,1,0.32,1) ${0.4 + i * 0.12}s forwards`,
              }}
            >
              <SpecCard
                title={c.title}
                items={[...c.items]}
                align={c.align}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Đường kẻ đáy */}
      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{ background: "#e5e7eb" }}
      />
    </section>
  );
}
