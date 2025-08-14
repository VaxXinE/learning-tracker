// src/components/AppHeader.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, Sun, MoonStar, Search, LogOut, LayoutDashboard, BookOpen, User2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function AppHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout: ctxLogout }: any = useAuth();
  const userLabel = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initial = userLabel.charAt(0).toUpperCase();

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // ----- Search state -----
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pathname?.startsWith('/search')) setQ(params.get('q') ?? '');
    else setQ('');
  }, [pathname, params]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}&scope=all` : `/search`);
  };

  // ----- User menu state -----
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close on outside click / Esc
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);

    if (menuOpen) {
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('keydown', onEsc);
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      if (typeof ctxLogout === 'function') {
        await ctxLogout();
      } else {
        // fallback langsung via Firebase
        const { getAuth, signOut } = await import('firebase/auth');
        await signOut(getAuth());
      }
      router.push('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-slate-900/50">
        <div className="container px-4 md:px-6">
          <div className="flex items-center h-14 gap-3">
            {/* Mobile menu */}
            <button
              onClick={onToggleSidebar}
              className="md:hidden rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </button>

            {/* Brand mini */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Learning Tracker
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400">Stay on track</span>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-0">
              <form onSubmit={onSubmit} className="relative max-w-md ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search courses, lessons, tasks… (Ctrl/Cmd+K)"
                  className="w-full pl-9 pr-16 py-2 rounded-xl bg-gray-100/70 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Theme toggle + user bubble */}
            <div className="relative flex items-center gap-2">
              <ThemeToggle
                icons={{
                  light: <Sun className="h-4 w-4" />,
                  dark: <MoonStar className="h-4 w-4" />,
                }}
              />

              {/* Avatar button */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={userLabel}
              >
                {initial}
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  ref={menuRef}
                  role="menu"
                  className="absolute right-0 top-10 w-60 rounded-2xl border border-white/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-200/70 dark:border-white/10">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{userLabel}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
                  </div>
                  <div className="p-1">
                    <MenuItem onClick={() => { setMenuOpen(false); router.push('/dashboard'); }}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </MenuItem>
                    <MenuItem onClick={() => { setMenuOpen(false); router.push('/courses'); }}>
                      <BookOpen className="h-4 w-4" />
                      <span>My Courses</span>
                    </MenuItem>
                    <MenuItem onClick={() => { setMenuOpen(false); router.push('/profile'); }}>
                      <User2 className="h-4 w-4" />
                      <span>Profile</span>
                    </MenuItem>
                  </div>
                  <div className="p-1 border-t border-slate-200/70 dark:border-white/10">
                    <MenuItem danger onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </MenuItem>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
        ${danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
      role="menuitem"
    >
      {children}
    </button>
  );
}
