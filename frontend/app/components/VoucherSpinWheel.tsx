"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Gift, Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Prize {
  _id: string;
  code: string;
  label: string;
  type: "percent" | "fixed" | "freeship" | "none";
}

interface SpinResult {
  code: string;
  label: string;
  type: string;
  value: number;
}

/** Ô trắng và vàng nhạt xen kẽ, chữ đỏ đọc rõ trên cả hai */
const SEGMENT_COLORS = ["#FFFFFF", "#FBE39B"];

/** Ô "chúc may mắn lần sau" vàng đậm, nổi hẳn giữa các ô còn lại */
const NONE_COLOR = "#F5B921";

/** Mọi ô đều nền sáng nên chữ dùng chung một màu đỏ */
const LABEL_COLOR = "#B91C1C";

const VB = 200; // viewBox
const CX = 100;
const CY = 100;
const R = 96;

/** Toạ độ trên đường tròn, góc tính từ đỉnh (12h) theo chiều kim đồng hồ */
function pointAt(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.sin(a),
    y: CY - radius * Math.cos(a),
  };
}

/** Đường viền một múi quạt từ startAngle đến endAngle */
function wedgePath(startAngle: number, endAngle: number) {
  const p1 = pointAt(startAngle, R);
  const p2 = pointAt(endAngle, R);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${p1.x.toFixed(3)} ${p1.y.toFixed(3)} A ${R} ${R} 0 ${largeArc} 1 ${p2.x.toFixed(3)} ${p2.y.toFixed(3)} Z`;
}

/** Cắt nhãn dài thành tối đa 2 dòng cho vừa múi quạt */
function wrapLabel(label: string, maxChars = 13): string[] {
  const words = label.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = "";

  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);

  // Gộp phần thừa vào dòng 2 để không quá 2 dòng
  if (lines.length > 2) {
    return [lines[0], lines.slice(1).join(" ")];
  }
  return lines;
}

export default function VoucherSpinWheel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [existingResult, setExistingResult] = useState<SpinResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [error, setError] = useState("");
  const wheelRef = useRef<SVGSVGElement>(null);

  const fetchPrizes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/spin/prizes`);
      const data = await res.json();
      setPrizes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải danh sách vòng quay:", err);
    } finally {
      setLoadingPrizes(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    const token =
      localStorage.getItem("smarthub_token") || localStorage.getItem("token");

    if (!token) {
      setIsLoggedIn(false);
      return;
    }
    setIsLoggedIn(true);

    try {
      const res = await fetch(`${API_URL}/api/spin/spin-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.hasSpun) {
        setHasSpun(true);
        setExistingResult(data.voucher);
      }
    } catch (err) {
      console.error("Lỗi kiểm tra trạng thái quay:", err);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPrizes();
      checkStatus();
    } else {
      // Reset các state khi modal đóng để tránh wheel quay tiếp lần sau
      setSpinning(false);
      setRotation(0);
      setResult(null);
      setShowResultModal(false);
      setError("");
    }
  }, [open, fetchPrizes, checkStatus]);

  const segmentAngle = prizes.length > 0 ? 360 / prizes.length : 0;

  const handleSpin = async () => {
    setError("");

    const token =
      localStorage.getItem("smarthub_token") || localStorage.getItem("token");
    if (!token) {
      setError("Vui lòng đăng nhập để quay vòng quay may mắn!");
      return;
    }
    if (hasSpun || spinning) return;

    setSpinning(true);
    try {
      const res = await fetch(`${API_URL}/api/spin/spin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không thể quay lúc này");
      }

      const won: SpinResult = data.voucher;

      const wonIndex = prizes.findIndex((p) => p.code === won.code);
      const targetIndex = wonIndex >= 0 ? wonIndex : 0;

      const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);

      const extraSpins = 5 * 360;
      const finalRotation =
        rotation - (rotation % 360) + extraSpins + targetAngle;

      setRotation(finalRotation);

      setTimeout(() => {
        setSpinning(false);
        setHasSpun(true);
        setResult(won);
        setShowResultModal(true);
      }, 4200);
    } catch (err: any) {
      setError(err.message);
      setSpinning(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="relative border-2 border-amber-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, #E02B20 0%, #C4161C 55%, #8A0B10 100%)",
        }}
      >
        {/* Họa tiết ánh sáng trang trí góc */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full transition"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="text-amber-300 animate-pulse" size={24} />
          <h2 className="text-white font-extrabold text-xl sm:text-2xl tracking-wide m-0 drop-shadow-md">
            Vòng Quay May Mắn
          </h2>
          <Sparkles className="text-amber-300 animate-pulse" size={24} />
        </div>
        <p className="text-amber-100/90 text-xs sm:text-sm mb-6 font-medium">
          Mỗi tài khoản nhận 1 lượt quay trúng thưởng 100%
        </p>

        {loadingPrizes ? (
          <div className="py-20 text-red-100 text-sm font-medium animate-pulse flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-amber-300 border-t-transparent rounded-full animate-spin" />
            Đang tải dữ liệu vòng quay...
          </div>
        ) : prizes.length === 0 ? (
          <div className="py-16 text-red-100 text-sm bg-black/10 rounded-xl">
            Chương trình quay số hiện chưa có sẵn
          </div>
        ) : (
          <>
            <div className="relative mx-auto mb-6 w-[270px] h-[270px] sm:w-[310px] sm:h-[310px] flex items-center justify-center">
              {/* Kim chỉ vị trí (Pointer) */}
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 20,
                  filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.4))",
                }}
              >
                <svg width="34" height="42" viewBox="0 0 30 38">
                  <path
                    d="M15 38 L2 15 L8 2 L22 2 L28 15 Z"
                    fill="#DC2626"
                    stroke="#FFE4E6"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Vòng quay chính */}
              <svg
                ref={wheelRef}
                viewBox={`0 0 ${VB} ${VB}`}
                width="100%"
                height="100%"
                style={{
                  display: "block",
                  borderRadius: "50%",
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                    : "none",
                  boxShadow:
                    "0 0 0 8px #FFFFFF, 0 0 0 12px #F5B921, 0 12px 35px rgba(0,0,0,0.5)",
                }}
              >
                <defs>
                  <radialGradient id="wheelDepth" cx="50%" cy="50%" r="50%">
                    <stop offset="65%" stopColor="#fff" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
                  </radialGradient>
                </defs>

                {/* Các múi quạt */}
                {prizes.map((prize, i) => {
                  const start = i * segmentAngle;
                  const end = start + segmentAngle;
                  const fill =
                    prize.type === "none"
                      ? NONE_COLOR
                      : SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                  return (
                    <path
                      key={prize._id}
                      d={wedgePath(start, end)}
                      fill={fill}
                      stroke="#F5B921"
                      strokeWidth="0.6"
                    />
                  );
                })}

                {/* 12 chấm đốm đèn trang trí quanh vành */}
                {Array.from({ length: 12 }).map((_, idx) => {
                  const pt = pointAt(idx * 30, R - 3);
                  return (
                    <circle
                      key={`dot-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="1.8"
                      fill="#FFFFFF"
                      stroke="#F5B921"
                      strokeWidth="0.5"
                    />
                  );
                })}

                {/* Lớp phủ shadow chiều sâu */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="url(#wheelDepth)"
                  pointerEvents="none"
                />

                {/* Chữ hiển thị trên múi quạt */}
                {prizes.map((prize, i) => {
                  const mid = i * segmentAngle + segmentAngle / 2;
                  const flip = mid > 90 && mid < 270;
                  const lines = wrapLabel(prize.label);
                  const baseY = 42;

                  return (
                    <g
                      key={`label-${prize._id}`}
                      transform={
                        `rotate(${mid}, ${CX}, ${CY})` +
                        (flip ? ` rotate(180, ${CX}, ${baseY})` : "")
                      }
                      pointerEvents="none"
                    >
                      <text
                        x={CX}
                        y={baseY}
                        textAnchor="middle"
                        fill={LABEL_COLOR}
                        fontSize={lines.length > 1 ? 7 : 8}
                        fontWeight={700}
                      >
                        {lines.map((line, li) => (
                          <tspan
                            key={li}
                            x={CX}
                            dy={li === 0 ? 0 : lines.length > 1 ? 10 : 0}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Trục tâm giữa */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, #FFFFFF 60%, #FFFBEB 100%)",
                  border: "3px solid #F5B921",
                  boxShadow:
                    "0 4px 12px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.8)",
                  zIndex: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Gift size={26} className="text-red-600 drop-shadow-sm" />
              </div>
            </div>

            {!isLoggedIn && (
              <p className="text-amber-200 text-xs mb-3 font-medium bg-black/20 py-1.5 px-3 rounded-full inline-block">
                Vui lòng đăng nhập để quay
              </p>
            )}

            {hasSpun ? (
              <div className="bg-white/95 backdrop-blur border border-amber-300 rounded-xl px-4 py-3 text-sm text-gray-800 shadow-md">
                Bạn đã nhận mã quà tặng:{" "}
                <strong className="font-mono text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {existingResult?.code || result?.code}
                </strong>
                <p className="text-xs text-gray-500 mt-1">
                  Đã lưu vào kho voucher của bạn!
                </p>
              </div>
            ) : (
              <button
                onClick={handleSpin}
                disabled={spinning || !isLoggedIn}
                className="relative group overflow-hidden bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 hover:from-amber-100 hover:to-amber-400 text-red-950 font-black text-lg px-10 py-3.5 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_6px_20px_rgba(245,185,33,0.4)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                <span className="relative z-10 drop-shadow-sm">
                  {spinning ? "ĐANG QUAY..." : "QUAY NGAY"}
                </span>
                <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
              </button>
            )}

            {error && (
              <p className="text-amber-200 text-xs mt-3 bg-red-900/50 py-1 px-3 rounded-lg border border-red-500/30">
                {error}
              </p>
            )}
          </>
        )}
      </div>

      {/* Modal kết quả khi quay xong */}
      {showResultModal && result && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowResultModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-amber-400 shadow-2xl rounded-2xl p-6 max-w-xs w-full text-center animate-in zoom-in-95 duration-200"
          >
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500 shadow-inner">
              <Gift size={36} />
            </div>
            <h3 className="text-gray-900 font-extrabold text-lg mb-1">
              {result.type === "none" ? "May mắn lần sau!" : "Chúc mừng bạn!"}
            </h3>
            {result.type !== "none" ? (
              <>
                <p className="text-amber-600 font-black text-2xl my-2 drop-shadow-sm">
                  {result.label}
                </p>
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-2.5 mb-4">
                  <p className="text-gray-500 text-xs mb-1">
                    Mã ưu đãi của bạn:
                  </p>
                  <span className="text-red-600 font-mono font-bold text-base select-all">
                    {result.code}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-sm mb-4">
                Cảm ơn bạn đã tham gia chương trình!
              </p>
            )}
            <button
              onClick={() => setShowResultModal(false)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
