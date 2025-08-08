import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { TopBar } from '@/components/TopBar';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Learning Tracker',
  description: 'CRUD capstone | Next.js + Firebase',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-dvh grid md:grid-cols-[260px_1fr]">
              <aside className="hidden md:block border-r border-gray-200 dark:border-gray-800 p-4">
                <div className="font-semibold mb-4">LearningTracker</div>
                <nav className="grid gap-2 text-sm">
                  <Link href="/dashboard" className="block rounded-xl px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Dashboard</Link>
                  <Link href="/courses" className="block rounded-xl px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Courses</Link>
                  <Link href="/lessons" className="block rounded-xl px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Lessons</Link>
                  <Link href="/tasks" className="block rounded-xl px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Tasks (Kanban)</Link>
                </nav>
              </aside>
              <main className="py-6">
                <div className="container">
                  <TopBar />
                  {children}
                </div>
              </main>
            </div>
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
