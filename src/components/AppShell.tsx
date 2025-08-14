// appshell.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/AuthProvider';

import {
  LayoutDashboard, BookOpen, GraduationCap, ListChecks, X
} from 'lucide-react';

// ⬇️ Use the shared header component you already built
// If your file is PascalCase, change to "@/components/AppHeader"
import AppHeader from '@/components/AppHeader';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/courses',   label: 'Courses',   icon: BookOpen },
  { href: '/lessons',   label: 'Lessons',   icon: GraduationCap },
  { href: '/tasks',     label: 'Tasks (Kanban)', icon: ListChecks },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // mobile drawer state (sidebar)
  const [open, setOpen] = useState(false);

  const isDark = resolvedTheme === 'dark';

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="min-h-dvh bg-white dark:bg-slate-900">
        <main className="py-6">
          <div className="container">{children}</div>
        </main>
      </div>
    );
  }

  // Pages without chrome (no sidebar/header)
  const minimal = pathname === '/' || pathname?.startsWith('/auth');
  if (minimal) {
    return (
      <main className="py-6">
        <div className="container">{children}</div>
      </main>
    );
  }

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(href) ||
    (href === '/tasks' && pathname.startsWith('/task'));

  const Sidebar = (
    <aside className="hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 p-4">
      <div className="mb-4 text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
        LearningTracker
      </div>
      <nav className="grid gap-2 text-sm">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={[
              'flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
              isActive(href)
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
            ].join(' ')}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-4 text-xs text-slate-400 dark:text-slate-500">
        {user?.email}
      </div>
    </aside>
  );

  return (
    <div
      className="
        min-h-dvh grid md:grid-cols-[260px_1fr]
        bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
        dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
      "
    >
      {/* Desktop sidebar */}
      {Sidebar}

      {/* Mobile drawer (no trigger button here; AppHeader opens it via onOpenMenu) */}
      <div className="md:hidden">
        {open && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-[260px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold">LearningTracker</div>
                <button
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="grid gap-2 text-sm">
                {NAV.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={[
                      'flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
                      isActive(href)
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
                    ].join(' ')}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <main className="py-6">
        {/* Header (shared) */}
        <div className="mb-4 sticky top-0 z-20">
          <AppHeader onToggleSidebar={() => setOpen(true)} />
        </div>

        {/* Page content */}
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
