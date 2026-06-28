"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Chuyển sang nền sáng" : "Chuyển sang nền tối"}
      aria-label="Đổi giao diện sáng/tối"
      className="fixed left-4 bottom-4 z-50 w-11 h-11 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
}
