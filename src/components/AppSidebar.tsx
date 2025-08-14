// src/components/AppSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LayoutDashboard, BookOpen, NotebookText, KanbanSquare } from 'lucide-react';
import clsx from 'clsx';

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 rounded-xl px-3 py-2 transition-colors',
        active
          ? 'bg-blue-600/10 text-blue-700 dark:text-blue-300 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300'
      )}
    >
      <Icon className={clsx('h-5 w-5', active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export default function AppSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/lessons', label: 'Lessons', icon: NotebookText },
    { href: '/tasks', label: 'Tasks (Kanban)', icon: KanbanSquare },
  ];

  // Mobile overlay
  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block sticky top-0 h-dvh border-r border-gray-200 dark:border-gray-800 p-4">
        <div className="rounded-2xl border border-white/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-slate-900/40 p-4 shadow-sm">
          <div className="font-bold mb-4 text-slate-900 dark:text-slate-100">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              LearningTracker
            </span>
          </div>
          <nav className="grid gap-2">
            {links.map((l) => (
              <NavItem
                key={l.href}
                href={l.href}
                icon={l.icon}
                label={l.label}
                active={pathname?.startsWith(l.href) ?? false}
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <div
        className={clsx(
          'md:hidden fixed inset-0 z-50 transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div
          className={clsx(
            'absolute left-0 top-0 h-full w-[82%] max-w-[320px] p-4',
            'border-r border-gray-200 dark:border-gray-800',
            'bg-white/80 dark:bg-slate-900/70 backdrop-blur',
            'translate-x-0 transition-transform',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                LearningTracker
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
          <nav className="grid gap-2">
            {links.map((l) => (
              <NavItem
                key={l.href}
                href={l.href}
                icon={l.icon}
                label={l.label}
                active={pathname?.startsWith(l.href) ?? false}
                onClick={onClose}
              />
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
