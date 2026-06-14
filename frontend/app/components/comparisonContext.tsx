'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export interface ComparisonProduct {
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

interface ComparisonContextType {
  items: ComparisonProduct[];
  addItem: (p: ComparisonProduct) => boolean;
  removeItem: (id: number) => void;
  clearItems: () => void;
  isInComparison: (id: number) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType>({
  items: [],
  addItem: () => false,
  removeItem: () => {},
  clearItems: () => {},
  isInComparison: () => false,
});

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ComparisonProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('smarthub_compare');
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const addItem = (p: ComparisonProduct): boolean => {
    let added = false;
    setItems(prev => {
      if (prev.length >= 3 || prev.some(x => x.id === p.id)) return prev;
      const next = [...prev, p];
      localStorage.setItem('smarthub_compare', JSON.stringify(next));
      added = true;
      return next;
    });
    return added;
  };

  const removeItem = (id: number) => {
    setItems(prev => {
      const next = prev.filter(x => x.id !== id);
      localStorage.setItem('smarthub_compare', JSON.stringify(next));
      return next;
    });
  };

  const clearItems = () => {
    setItems([]);
    localStorage.removeItem('smarthub_compare');
  };

  const isInComparison = (id: number) => items.some(x => x.id === id);

  return (
    <ComparisonContext.Provider value={{ items, addItem, removeItem, clearItems, isInComparison }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  return useContext(ComparisonContext);
}
