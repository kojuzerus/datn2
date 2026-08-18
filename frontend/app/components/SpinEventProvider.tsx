"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { X, Gift, Bell } from "lucide-react";
import VoucherSpinWheel from "./VoucherSpinWheel";
import Rabbit3D from "./Rabbit3D";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const PROMO_KEY = "smarthub_promo_seen_v1";

interface Prize {
  _id: string;
  code: string;
  label: string;
  type: "percent" | "fixed" | "freeship" | "none";
}

type Stage = "closed" | "banner" | "wheel";

interface SpinEventContextValue {
  /** Mở banner giới thiệu Vòng quay (bước 1) — dùng cho cả popup tự động lẫn nút nổi. */
  openBanner: () => void;
}

const SpinEventContext = createContext<SpinEventContextValue | null>(null);

export function useSpinEvent() {
  const ctx = useContext(SpinEventContext);
  if (!ctx) throw new Error("useSpinEvent phải được gọi bên trong SpinEventProvider");
  return ctx;
}

/**
 * Nơi duy nhất quản lý "sự kiện Vòng quay may mắn": banner giới thiệu (bước 1) rồi
 * đến Vòng quay thật (bước 2). Mount 1 lần ở root layout — PromoModal (tự bật khi mở
 * web) và FloatingSpinWheel (nút nổi) đều chỉ gọi openBanner() để dùng chung 1 luồng,
 * tránh mỗi nơi tự vẽ 1 banner/modal riêng.
 */
export function SpinEventProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>("closed");
  const [prizes, setPrizes] = useState<Prize[]>([]);

  useEffect(() => {
    if (stage !== "banner" || prizes.length > 0) return;
    fetch(`${API_URL}/api/spin/prizes`)
      .then((r) => r.json())
      .then((data) => setPrizes(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [stage, prizes.length]);

  // sessionStorage (không phải localStorage): hiện lại mỗi khi mở tab/trình duyệt mới,
  // nhưng F5 lại trong cùng tab thì không hiện lại nữa.
  const markSeen = () => sessionStorage.setItem(PROMO_KEY, "1");

  const openBanner = () => setStage("banner");

  const dismiss = () => {
    markSeen();
    setStage("closed");
  };

  const openWheel = () => {
    markSeen();
    setStage("wheel");
  };

  return (
    <SpinEventContext.Provider value={{ openBanner }}>
      {children}

      {/* ── Banner giới thiệu Vòng quay — bước 1 ── */}
      {stage === "banner" && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={dismiss} />

          {/* Modal card */}
          <div
            className="relative w-full max-w-[380px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ animation: "fadeInScale 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            {/* ── Phần đỏ/cam — toàn bộ nội dung xoay quanh vòng quay ── */}
            <div
              className="relative overflow-hidden"
              style={{ background: "linear-gradient(140deg,#7f1d1d 0%,#dc2626 40%,#f97316 100%)" }}
            >
              {/* Confetti dots */}
              {[...Array(14)].map((_, i) => (
                <span
                  key={i}
                  className="absolute rounded-full pointer-events-none opacity-25"
                  style={{
                    width: `${4 + (i % 5) * 3}px`,
                    height: `${4 + (i % 5) * 3}px`,
                    left: `${(i * 21 + 5) % 92}%`,
                    top: `${(i * 27 + 8) % 85}%`,
                    background: ["#fde68a", "#fbbf24", "#ffffff", "#fed7aa", "#fca5a5"][i % 5],
                  }}
                />
              ))}

              {/* Close button */}
              <button
                onClick={dismiss}
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

              {/* Headline */}
              <div className="relative z-10 text-center px-4 pt-2">
                <p className="text-white/90 text-[11px] font-bold uppercase tracking-[0.25em]">Ưu đãi cực đỉnh</p>
                <p
                  className="font-black uppercase leading-none mt-1"
                  style={{
                    fontSize: "clamp(1.9rem, 8vw, 2.4rem)",
                    color: "#fde68a",
                    textShadow: "0 3px 0 rgba(0,0,0,0.3), 0 6px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  QUAY NGAY
                </p>
                <p
                  className="font-black uppercase leading-none"
                  style={{
                    fontSize: "clamp(1.3rem, 6vw, 1.7rem)",
                    color: "#ffffff",
                    textShadow: "0 2px 0 rgba(0,0,0,0.3)",
                  }}
                >
                  NHẬN QUÀ CỰC CHẤT
                </p>
              </div>

              {/* ── Vòng quay thu nhỏ + linh vật thỏ SmartHub đứng cạnh cổ vũ ── */}
              <div className="relative z-10 flex items-end justify-center gap-2 pt-3">
                <div className="relative w-[100px] h-[100px] shrink-0">
                  {/* Vầng sáng phía sau vòng quay */}
                  <span
                    className="absolute -inset-3 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)" }}
                  />
                  {/* Kim chỉ cố định */}
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 z-10"
                    style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))" }}
                  >
                    <svg width="18" height="20" viewBox="0 0 18 20">
                      <path
                        d="M9 20 L1.5 4 A8 8 0 0 1 16.5 4 Z"
                        fill="#dc2626"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="w-full h-full animate-[spin_9s_linear_infinite]">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                      <path d="M50 50 L50 2 A48 48 0 0 1 91.5 26 Z" fill="#fde68a" />
                      <path d="M50 50 L91.5 26 A48 48 0 0 1 91.5 74 Z" fill="#ffffff" />
                      <path d="M50 50 L91.5 74 A48 48 0 0 1 50 98 Z" fill="#fbbf24" />
                      <path d="M50 50 L50 98 A48 48 0 0 1 8.5 74 Z" fill="#ffffff" />
                      <path d="M50 50 L8.5 74 A48 48 0 0 1 8.5 26 Z" fill="#fde68a" />
                      <path d="M50 50 L8.5 26 A48 48 0 0 1 50 2 Z" fill="#ffffff" />
                      <circle cx="50" cy="50" r="47" fill="none" stroke="#ffffff" strokeWidth="3" />
                    </svg>
                  </div>
                  {/* Tâm cố định */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-white shadow-md border-2 border-amber-400 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Linh vật thỏ SmartHub — nhảy cổ vũ bên cạnh vòng quay */}
                <div className="shrink-0 mb-1" style={{ animation: "rabbit-jump 2.6s ease-in-out infinite" }}>
                  <Rabbit3D size={62} />
                </div>
              </div>

              {/* Phần thưởng đang chờ — lấy đúng danh sách thật từ vòng quay */}
              {prizes.length > 0 && (
                <div className="relative z-10 flex flex-wrap justify-center gap-1.5 px-6 pt-3 pb-1">
                  {prizes.map((p) => (
                    <span
                      key={p._id}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        p.type === "none"
                          ? "bg-white/10 border-white/25 text-white/60"
                          : "bg-white text-red-600 border-white"
                      }`}
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="h-4" />
            </div>

            {/* ── Footer ── */}
            <div className="bg-white px-4 pt-4 pb-5">
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-3">
                <Bell className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <p className="text-orange-700 text-[10px] font-semibold leading-tight">
                  Mỗi tài khoản chỉ có 1 lượt quay duy nhất — đừng bỏ lỡ!
                </p>
              </div>
              <button
                onClick={openWheel}
                className="w-full py-3.5 rounded-xl font-black text-white text-base flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                style={{
                  background: "linear-gradient(90deg,#f97316 0%,#dc2626 100%)",
                  boxShadow: "0 4px 18px rgba(220,38,38,0.40)",
                }}
              >
                <Gift className="w-5 h-5" />
                QUAY NGAY NHẬN QUÀ!
              </button>
              <button
                onClick={dismiss}
                className="w-full mt-2.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Bỏ qua, xem sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Vòng quay may mắn — bước 2 ── */}
      <VoucherSpinWheel open={stage === "wheel"} onClose={() => setStage("closed")} />
    </SpinEventContext.Provider>
  );
}
