'use client';

import { useEffect, useState } from 'react';

// Các nút nổi (chat AI, Zalo, lên đầu trang, vòng quay...) đều dùng
// position: fixed nên KHÔNG cuộn theo trang — khi khách cuộn tới cuối trang,
// chúng đứng yên tại chỗ và đè lên nội dung footer (nút "NHẬN NGAY", link...)
// thay vì biến mất/nhường chỗ. Hook này theo dõi khi footer (id="site-footer")
// lọt vào khung nhìn để các nút nổi tự ẩn đi lúc đó, tránh đè lên footer.
export function useHideOverFooter(): boolean {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHide(entry.isIntersecting),
      { rootMargin: '0px 0px 0px 0px' }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return hide;
}
