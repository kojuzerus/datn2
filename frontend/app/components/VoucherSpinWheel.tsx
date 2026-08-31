"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Gift } from "lucide-react";

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
        background: "rgba(0,0,0,0.7)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="relative border border-red-900/20 shadow-2xl rounded-2xl p-8 max-w-md w-full text-center"
        style={{
          background:
            "linear-gradient(140deg, #C4161C 0%, #E02B20 45%, #FB7423 100%)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 text-white/70 hover:text-white transition"
          aria-label="Đóng"
        >
          <X size={22} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-1">
          <Gift className="text-amber-300" size={24} />
          <h2 className="text-white font-bold text-xl m-0">
            Vòng quay may mắn SmartHub
          </h2>
        </div>
        <p className="text-red-50 text-sm mb-6">
          Mỗi tài khoản có 1 lượt quay duy nhất
        </p>

        {loadingPrizes ? (
          <div className="py-16 text-red-50 text-sm">Đang tải...</div>
        ) : prizes.length === 0 ? (
          <div className="py-16 text-red-50 text-sm">
            Chương trình quay số hiện không khả dụng
          </div>
        ) : (
          <>
            <div className="relative mx-auto mb-6 w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
              {/* Kim chỉ */}
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
                }}
              >
                <svg width="30" height="38" viewBox="0 0 30 38">
                  <path
                    d="M15 38 L2 15 L8 2 L22 2 L28 15 Z"
                    fill="#E01B24"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

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
                  boxShadow: "0 0 0 10px #FFFFFF, 0 10px 30px rgba(0,0,0,0.35)",
                }}
              >
                <defs>
                  {/* Làm mép ngoài đậm hơn tâm một chút cho có chiều sâu */}
                  <radialGradient id="wheelDepth" cx="50%" cy="50%" r="50%">
                    <stop offset="65%" stopColor="#fff" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.06" />
                  </radialGradient>
                </defs>

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

                {/* Lớp phủ tạo chiều sâu, không chắn sự kiện chuột */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="url(#wheelDepth)"
                  pointerEvents="none"
                />

                {/* Nhãn: xoay theo múi, tự lật 180° ở nửa dưới để không bị ngược */}
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

              {/* Trục giữa */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  border: "3px solid #F5B921",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
                  zIndex: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Gift size={24} className="text-red-600" />
              </div>
            </div>

            {!isLoggedIn && (
              <p className="text-amber-200 text-xs mb-3">
                Vui lòng đăng nhập để quay
              </p>
            )}

            {hasSpun ? (
              <div className="bg-white/95 border border-white rounded-xl px-4 py-3 text-sm text-gray-800">
                Bạn đã quay và nhận mã{" "}
                <strong className="font-mono">
                  {existingResult?.code || result?.code}
                </strong>
                . Dùng mã này khi thanh toán giỏ hàng nhé!
              </div>
            ) : (
              <button
                onClick={handleSpin}
                disabled={spinning || !isLoggedIn}
                className="bg-white hover:bg-red-50 disabled:bg-white/40 disabled:text-white/70 text-red-600 font-bold px-10 py-3 rounded-xl transition shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {spinning ? "Đang quay..." : "Quay ngay"}
              </button>
            )}

            {error && <p className="text-amber-200 text-xs mt-3">{error}</p>}
          </>
        )}
      </div>

      {showResultModal && result && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
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
            className="bg-white border-2 border-amber-400 shadow-xl rounded-2xl p-6 max-w-xs w-full text-center"
          >
            <Gift className="text-amber-500 mx-auto mb-3" size={40} />
            <h3 className="text-black font-bold text-lg mb-1">
              {result.type === "none"
                ? "Chúc bạn may mắn lần sau!"
                : "Chúc mừng bạn đã trúng thưởng!"}
            </h3>
            {result.type !== "none" && (
              <>
                <p className="text-amber-600 font-bold text-2xl my-2">
                  {result.label}
                </p>
                <p className="text-gray-600 text-xs mb-4">
                  Mã:{" "}
                  <span className="text-black font-mono">{result.code}</span> —
                  áp dụng khi thanh toán giỏ hàng
                </p>
              </>
            )}
            <button
              onClick={() => setShowResultModal(false)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg mt-2"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
