// frontend/hooks/useCart.ts
// Hook dùng chung để thêm vào giỏ hàng từ bất kỳ trang nào

import { useState } from 'react';
import { addToGuestCart } from '../lib/guestCart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useCart() {
  const [adding, setAdding] = useState(false);

  const addToCart = async (product: {
    productId: string;
    tenSanPham: string;
    hinhAnh?: string;
    gia: number;
    soLuong?: number;
    variant?: string;
  }) => {
    const token = localStorage.getItem('smarthub_token');

    // Chưa đăng nhập: lưu vào giỏ hàng cục bộ (localStorage)
    if (!token) {
      addToGuestCart({
        productId:  product.productId,
        tenSanPham: product.tenSanPham,
        hinhAnh:    product.hinhAnh || '',
        gia:        product.gia,
        soLuong:    product.soLuong || 1,
        variant:    product.variant || '',
      });
      window.dispatchEvent(new Event('cart-updated'));
      return true;
    }

    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId:  product.productId,
          tenSanPham: product.tenSanPham,
          hinhAnh:    product.hinhAnh || '',
          gia:        product.gia,
          soLuong:    product.soLuong || 1,
          variant:    product.variant || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Dispatch event để Header cập nhật số lượng
        window.dispatchEvent(new Event('cart-updated'));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setAdding(false);
    }
  };

  return { addToCart, adding };
}
