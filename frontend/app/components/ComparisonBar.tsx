'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ArrowRight, Repeat, Trash2, AlertTriangle, Search, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useComparison, ComparisonProduct } from './comparisonContext';

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

function AddSlot({ onAdd }: { onAdd: (p: ComparisonProduct) => void }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const debounce  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Autofocus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setResults([]); }
  }, [open]);

  const search = useCallback((q: string) => {
    clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API_URL}/api/products?search=${encodeURIComponent(q)}&limit=6&status=active`);
        const json = await res.json();
        if (json.success) setResults(json.data ?? []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 280);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    search(e.target.value);
  };

  const handleSelect = (r: SearchResult) => {
    onAdd({
      id: r.id, ten: r.ten, slug: r.slug, thumbnail: r.thumbnail,
      gia: r.gia, giaSale: r.giaSale, giamGia: r.giamGia ?? 0,
      danhGia: r.danhGia ?? 0, thuongHieu: r.thuongHieu, categoryName: r.categoryName,
    });
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="hidden sm:flex items-center gap-2 bg-gray-50 hover:bg-red-50 hover:border-red-300 rounded-xl px-3 py-1.5 border border-dashed border-gray-300 h-[42px] min-w-[140px] transition-colors group"
      >
        <Plus className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500 transition-colors" />
        <span className="text-xs text-gray-400 group-hover:text-red-500 transition-colors">Thêm sản phẩm</span>
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+10px)] left-0 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={handleChange}
                placeholder="Tìm sản phẩm để so sánh..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[320px] overflow-y-auto">
            {!query.trim() && (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nhập tên sản phẩm để tìm kiếm</p>
              </div>
            )}

            {query.trim() && !loading && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">Không tìm thấy sản phẩm nào</p>
              </div>
            )}

            {results.map(r => (
              <button
                key={r.id}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <img
                  src={r.thumbnail || 'https://placehold.co/48x48?text=?'}
                  alt={r.ten}
                  className="w-11 h-11 rounded-lg object-contain bg-gray-50 border border-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.ten}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.thuongHieu}</p>
                  <p className="text-xs font-semibold text-red-600 mt-0.5">
                    {fmt(r.giaSale ?? r.gia)}
                    {r.giaSale && (
                      <span className="ml-1.5 text-gray-400 line-through font-normal">{fmt(r.gia)}</span>
                    )}
                  </p>
                </div>
                <Plus className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparisonBar() {
  const { items, addItem, removeItem, clearItems, error, clearError } = useComparison();

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 3000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {error && (
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="mb-2 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-4 py-2.5 rounded-xl shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        </div>
      )}
      <div className="bg-white border-t-2 border-red-500 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-red-600 font-semibold text-sm flex-shrink-0">
            <Repeat className="w-4 h-4" />
            <span className="hidden sm:inline">So sánh ({items.length}/3)</span>
            <span className="sm:hidden">{items.length}/3</span>
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {/* Existing items */}
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-200 flex-shrink-0"
              >
                <img
                  src={item.thumbnail || 'https://placehold.co/32x32?text=?'}
                  alt={item.ten}
                  className="w-8 h-8 object-contain rounded"
                />
                <span className="text-xs font-medium text-gray-700 max-w-[100px] sm:max-w-[160px] truncate">
                  {item.ten}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add slots with search */}
            {items.length < 3 && Array.from({ length: 3 - items.length }).map((_, i) => (
              <AddSlot key={i} onAdd={p => addItem(p)} />
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={clearItems}
              className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-red-500 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa tất cả
            </button>
            <Link
              href="/sosanh"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                items.length >= 2
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-200 text-gray-400 pointer-events-none'
              }`}
            >
              <span className="hidden sm:inline">So sánh ngay</span>
              <span className="sm:hidden">So sánh</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
