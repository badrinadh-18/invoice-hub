import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      className={`relative inline-flex items-center justify-center gap-2 p-2 rounded-xl transition-all duration-200 select-none ${
        isDark
          ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-800 border border-slate-700/60 bg-slate-800/40 shadow-xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 bg-white shadow-xs'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 -rotate-12 scale-100" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
