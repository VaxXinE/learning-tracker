'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggle({
  icons,
}: { icons?: { light?: React.ReactNode; dark?: React.ReactNode } }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
        aria-label="Toggle theme"
      >…</button>
    );
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-gray-100/80 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (icons?.light ?? 'Light') : (icons?.dark ?? 'Dark')}
    </button>
  );
}
