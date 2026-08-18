'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSpinEvent, PROMO_KEY } from './SpinEventProvider';

// Tự mở banner giới thiệu Vòng quay (qua SpinEventProvider) khi vào trang chủ —
// chỉ hiện lần đầu của phiên truy cập (tab/trình duyệt mới), F5 lại trong cùng tab
// thì không hiện lại nữa (dùng sessionStorage, không phải localStorage).
export default function PromoModal() {
  const { openBanner } = useSpinEvent();
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    if (!isHome) return;
    const seen = sessionStorage.getItem(PROMO_KEY);
    if (seen !== '1') {
      const t = setTimeout(() => openBanner(), 900);
      return () => clearTimeout(t);
    }
  }, [isHome, openBanner]);

  return null;
}
