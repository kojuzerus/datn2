// frontend/components/AddToCartButton.tsx
'use client';

import { useState } from 'react';
import { useCart } from '../hooks/useCart';

interface Props {
  productId: string;
  tenSanPham: string;
  hinhAnh?: string;
  gia: number;
  variant?: string;
  className?: string;
}

export default function AddToCartButton({ productId, tenSanPham, hinhAnh, gia, variant, className }: Props) {
  const { addToCart, adding } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await addToCart({ productId, tenSanPham, hinhAnh, gia, variant });
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={adding}
      className={className || "flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"}
    >
      {adding ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
      ) : added ? (
        <>✓ Đã thêm</>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/>
          </svg>
          Thêm vào giỏ
        </>
      )}
    </button>
  );
}
