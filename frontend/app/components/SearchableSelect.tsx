'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface SelectOption {
  code: number;
  name: string;
}

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (code: number, name: string) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function SearchableSelect({
  options, value, onChange, placeholder, disabled = false, loading = false,
}: Props) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const containerRef        = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    setOpen(v => !v);
    setSearch('');
  };

  const select = (code: number, name: string) => {
    onChange(code, name);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 text-sm text-left transition-all ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : open
              ? 'border-red-400 ring-1 ring-red-100 bg-white'
              : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
        }`}
      >
        <span className={`truncate ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {loading ? 'Đang tải...' : value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ml-2 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute z-[200] top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nhập để tìm kiếm..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-400 text-center">
                Không tìm thấy &ldquo;{search}&rdquo;
              </p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => select(opt.code, opt.name)}
                  className={`w-full flex items-center justify-between gap-2 text-left px-4 py-2.5 text-sm transition-colors ${
                    value === opt.name
                      ? 'bg-red-50 text-red-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{opt.name}</span>
                  {value === opt.name && <Check className="w-3.5 h-3.5 shrink-0 text-red-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
