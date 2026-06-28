'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export interface FavoriteProduct {
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

interface FavoritesContextType {
  items: FavoriteProduct[];
  toggleItem: (p: FavoriteProduct) => void;
  removeItem: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  items: [],
  toggleItem: () => {},
  removeItem: () => {},
  isFavorite: () => false,
});

const STORAGE_KEY = 'smarthub_favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const persist = (next: FavoriteProduct[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const toggleItem = (p: FavoriteProduct) => {
    setItems(prev => {
      const exists = prev.some(x => x.id === p.id);
      const next = exists ? prev.filter(x => x.id !== p.id) : [...prev, p];
      persist(next);
      return next;
    });
  };

  const removeItem = (id: number) => {
    setItems(prev => {
      const next = prev.filter(x => x.id !== id);
      persist(next);
      return next;
    });
  };

  const isFavorite = (id: number) => items.some(x => x.id === id);

  return (
    <FavoritesContext.Provider value={{ items, toggleItem, removeItem, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
