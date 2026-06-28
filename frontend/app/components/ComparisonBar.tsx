'use client';
import { useEffect } from 'react';
import { X, ArrowRight, Repeat, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useComparison } from './comparisonContext';

export default function ComparisonBar() {
  const { items, removeItem, clearItems, error, clearError } = useComparison();

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

        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
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
                title="Xóa khỏi so sánh"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {Array.from({ length: 3 - items.length }).map((_, i) => (
            <div
              key={i}
              className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-dashed border-gray-300 h-[42px] min-w-[120px]"
            >
              <span className="text-xs text-gray-400">Thêm sản phẩm</span>
            </div>
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
