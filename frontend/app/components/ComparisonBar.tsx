'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ArrowRight, Repeat, Trash2, AlertTriangle, Search, Plus, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useComparison } from './comparisonContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SearchResult {
  id: number;
  ten: string;
  slug: string;
  thumbnail: string;
  gia: number;
  giaSale: number | null;
  giamGia: number;
  danhGia: number;
  thuongHieu: string;
  categoryName: string;
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export default function ComparisonBar() {
  const { items, addItem, removeItem, clearItems, isInComparison, error, clearError } = useComparison();

  const [panelOpen, setPanelOpen]   = useState(false);

  // Notify ScrollToTop to hide when panel is open
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('compare-panel', { detail: panelOpen }));
  }, [panelOpen]);
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<SearchResult[]>([]);
  const [loading, setLoading]       = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const debounce  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Category of first item (to filter suggestions)
  const lockedCategory = items[0]?.categoryName ?? '';

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 3000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  // Focus input when panel opens; fetch same-category products on open
  useEffect(() => {
    if (panelOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      fetchProducts('');
    } else {
      setQuery('');
      setResults([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);

  const fetchProducts = useCallback((q: string) => {
    clearTimeout(debounce.current);
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: '12', status: 'active' });
        if (q.trim()) params.set('search', q.trim());
        if (lockedCategory) params.set('category_name', lockedCategory);
        const res  = await fetch(`${API_URL}/api/products?${params}`);
        const json = await res.json();
        if (json.success) setResults(json.data ?? []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, q ? 280 : 0);
  }, [lockedCategory]);

  const handleQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    fetchProducts(e.target.value);
  };

  const handleAdd = (r: SearchResult) => {
    addItem({
      id: r.id, ten: r.ten, slug: r.slug, thumbnail: r.thumbnail,
      gia: r.gia, giaSale: r.giaSale, giamGia: r.giamGia ?? 0,
      danhGia: r.danhGia ?? 0, thuongHieu: r.thuongHieu, categoryName: r.categoryName,
    });
  };

  if (items.length === 0) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-[48] bg-black/20"
          onClick={() => setPanelOpen(false)}
        />
      )}

      {/* ── Search panel ── */}
      {panelOpen && (
        <div className="fixed bottom-[64px] left-0 right-0 z-[49] flex justify-center px-4 pb-3">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
               style={{ maxHeight: 'calc(100vh - 140px)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Chọn sản phẩm để so sánh
                </p>
                {lockedCategory && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Đang hiển thị sản phẩm cùng loại: <span className="text-red-500 font-medium">{lockedCategory}</span>
                  </p>
                )}
              </div>
              <button onClick={() => setPanelOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={handleQuery}
                  placeholder={`Tìm trong ${lockedCategory || 'sản phẩm'}...`}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition"
                />
                {loading
                  ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  : query && <button onClick={() => { setQuery(''); fetchProducts(''); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                }
              </div>
            </div>

            {/* Product grid */}
            <div className="overflow-y-auto p-4">
              {!loading && results.length === 0 && (
                <div className="py-10 text-center text-gray-400 text-sm">Không tìm thấy sản phẩm nào</div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {results.map(r => {
                  const already = isInComparison(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => !already && handleAdd(r)}
                      disabled={already}
                      className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all group ${
                        already
                          ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-100 bg-gray-50 hover:border-red-300 hover:bg-red-50 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      <div className="relative w-full">
                        <img
                          src={r.thumbnail || 'https://placehold.co/80x80?text=?'}
                          alt={r.ten}
                          className="w-full aspect-square object-contain rounded-lg mb-2"
                        />
                        {already ? (
                          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            Đã chọn
                          </span>
                        ) : (
                          <span className="absolute top-1 right-1 bg-white border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <Plus className="w-3 h-3 text-red-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-gray-800 line-clamp-2 leading-tight mb-1">{r.ten}</p>
                      <p className="text-[11px] font-bold text-red-600">{fmt(r.giaSale ?? r.gia)}</p>
                      {r.giaSale && (
                        <p className="text-[10px] text-gray-400 line-through">{fmt(r.gia)}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-4 py-2.5 rounded-xl shadow-sm whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* ── Bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-red-500 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-4">

          {/* Label */}
          <div className="flex items-center gap-1.5 text-red-600 font-semibold text-sm flex-shrink-0">
            <Repeat className="w-4 h-4" />
            <span className="hidden sm:inline">So sánh ({items.length}/3)</span>
            <span className="sm:hidden">{items.length}/3</span>
          </div>

          {/* Items + add slots */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {items.map(item => (
              <div key={item.id}
                className="flex items-center gap-2 bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-200 flex-shrink-0">
                <img src={item.thumbnail || 'https://placehold.co/32x32?text=?'} alt={item.ten}
                  className="w-8 h-8 object-contain rounded" />
                <span className="text-xs font-medium text-gray-700 max-w-[100px] sm:max-w-[160px] truncate">{item.ten}</span>
                <button onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {items.length < 3 && (
              <button
                onClick={() => setPanelOpen(v => !v)}
                className={`hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5 border border-dashed h-[42px] min-w-[150px] transition-all flex-shrink-0 ${
                  panelOpen
                    ? 'border-red-400 bg-red-50 text-red-500'
                    : 'border-gray-300 bg-gray-50 text-gray-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Thêm sản phẩm</span>
                <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${panelOpen ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={clearItems}
              className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-red-500 text-xs font-medium transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Xóa tất cả
            </button>
            <Link href="/sosanh"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                items.length >= 2
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-200 text-gray-400 pointer-events-none'
              }`}>
              <span className="hidden sm:inline">So sánh ngay</span>
              <span className="sm:hidden">So sánh</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
