'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible]           = useState(false);
  const [panelOpen, setPanelOpen]       = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setPanelOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener('compare-panel', handler);
    return () => window.removeEventListener('compare-panel', handler);
  }, []);

  if (!visible || panelOpen) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-5 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
      title="Lên đầu trang"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
