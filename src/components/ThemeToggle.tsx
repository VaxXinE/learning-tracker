'use client';
import { useThemeStore } from '@/store/theme';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggle } = useThemeStore();
  
  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder during SSR to prevent hydration mismatch
    return (
      <button
        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }
  
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
}
