"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Gift, X } from "lucide-react";
import { useSpinEvent } from "./SpinEventProvider";

export default function FloatingSpinWheel() {
  const { openBanner } = useSpinEvent();
  const pathname = usePathname();
  // Chỉ ẩn tạm cho lần xem hiện tại — không lưu localStorage, nên tải lại trang
  // (F5 / mở lại) sẽ luôn hiện lại nút vòng quay này.
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
  };

  // Chỉ hiển thị ở trang chủ, và khi khách chưa bấm ẩn trong lần xem này
  if (pathname !== "/" || dismissed) return null;

  return (
    <div className="fixed bottom-40 left-4 z-40 flex flex-col items-center">
      {/* 1. Nhãn phía trên — gọn, khít với nút tròn bên dưới, không tràn ra ngoài */}
      <div className="mb-1.5 px-2.5 py-0.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-bold rounded-full shadow-lg animate-pulse select-none border border-red-400/30 whitespace-nowrap">
        Vòng quay
      </div>

      <div className="relative">
        {/* Nút X — ẩn tạm widget này, đặt ngoài <button> chính để không lồng button trong button */}
        <button
          onClick={handleDismiss}
          title="Ẩn vòng quay"
          className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-white text-gray-500 shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:text-red-500 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>

        {/* 2. Nút tròn — bấm vào mở banner giới thiệu trước, không mở thẳng vòng quay */}
        <button
          onClick={openBanner}
          className="relative group flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
          title="Vòng quay may mắn"
        >
          {/* Vầng sáng phát nhẹ phía sau, cùng tông với banner đỏ-cam-vàng */}
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-40"
            style={{
              background:
                "radial-gradient(circle, #fbbf24 0%, transparent 70%)",
            }}
          />

          {/* Viền ngoài — gradient đỏ/cam/vàng đồng bộ với banner + vòng quay thật */}
          <div
            className="relative w-full h-full rounded-full p-[3px] shadow-2xl"
            style={{
              background:
                "linear-gradient(135deg,#dc2626 0%,#f97316 55%,#fbbf24 100%)",
            }}
          >
            {/* VÒNG QUAY TỰ XOAY — tông vàng-kim/trắng như banner, không còn cầu vồng lộn xộn */}
            <div className="w-full h-full rounded-full animate-[spin_9s_linear_infinite] overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M50 50 L50 2 A48 48 0 0 1 91.5 26 Z" fill="#fde68a" />
                <path
                  d="M50 50 L91.5 26 A48 48 0 0 1 91.5 74 Z"
                  fill="#ffffff"
                />
                <path d="M50 50 L91.5 74 A48 48 0 0 1 50 98 Z" fill="#fbbf24" />
                <path d="M50 50 L50 98 A48 48 0 0 1 8.5 74 Z" fill="#ffffff" />
                <path d="M50 50 L8.5 74 A48 48 0 0 1 8.5 26 Z" fill="#fde68a" />
                <path d="M50 50 L8.5 26 A48 48 0 0 1 50 2 Z" fill="#ffffff" />
              </svg>
            </div>
          </div>

          {/* Tâm cố định ở giữa (không xoay theo vòng) — dùng icon Gift đồng bộ với banner & vòng quay thật */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-7 h-7 rounded-full bg-white shadow-md border-2 border-amber-400 flex items-center justify-center">
              <Gift className="w-3.5 h-3.5 text-red-600" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
