"use client";

import { useState } from "react";
import VoucherSpinWheel from "./VoucherSpinWheel";

export default function FloatingSpinWheel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Container góc dưới bên phải - đẩy cao lên trên nút bấm khác */}
      <div className="fixed bottom-40 right-4 z-40 flex flex-col items-center">
        {/* 1. Nhãn Tooltip phía trên (nhấp nháy nhẹ) */}
        <div className="mb-1.5 px-3.5 py-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 animate-bounce select-none border border-red-400/30">
          <span>Vòng quay</span>
          <span className="text-sm">🎁</span>
        </div>

        {/* 2. Nút tròn Icon chính */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
          title="Mở Vòng quay may mắn"
        >
          {/* VÒNG QUAY TỰ ĐỘNG XOAY LIÊN TỤC (spin 8s chậm dãi mượt mà) */}
          <div className="w-10 h-10 animate-[spin_8s_linear_infinite]">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
              {/* Các múi vòng quay màu sắc */}
              <path d="M50 50 L50 2 A48 48 0 0 1 91.5 26 Z" fill="#f59e0b" />
              <path d="M50 50 L91.5 26 A48 48 0 0 1 91.5 74 Z" fill="#ef4444" />
              <path d="M50 50 L91.5 74 A48 48 0 0 1 50 98 Z" fill="#3b82f6" />
              <path d="M50 50 L50 98 A48 48 0 0 1 8.5 74 Z" fill="#10b981" />
              <path d="M50 50 L8.5 74 A48 48 0 0 1 8.5 26 Z" fill="#8b5cf6" />
              <path d="M50 50 L8.5 26 A48 48 0 0 1 50 2 Z" fill="#ec4899" />
              {/* Đường viền ngoài */}
              <circle
                cx="50"
                cy="50"
                r="47"
                fill="none"
                stroke="#fef08a"
                strokeWidth="3"
              />
            </svg>
          </div>

          {/* Tâm cố định ở giữa (Không bị xoay theo vòng) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-5 h-5 rounded-full bg-white shadow-md border-2 border-amber-400 flex items-center justify-center">
              <span className="text-[10px] font-black text-red-600">GO</span>
            </div>
          </div>

          {/* 3. Chấm xanh Online ở góc trên phải */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full z-10" />
        </button>
      </div>

      {/* Component Vòng quay mở ra khi click */}
      <VoucherSpinWheel open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
