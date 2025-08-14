// src/app/page.tsx
'use client';

import Link from 'next/link';
import {
  ArrowRight, BookOpen, GraduationCap, ListChecks, LayoutDashboard, Shield, Sparkles,
} from 'lucide-react';

export default function Home() {
  return (
    <div
      className="
        relative w-screen overflow-x-hidden
        min-h-[100svh] md:min-h-dvh
        bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
        dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
        text-slate-900 dark:text-white
      "
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/10" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/10" />

      {/* Full-bleed wrapper with responsive paddings */}
      <div className="px-4 sm:px-6 lg:px-10 2xl:px-16 py-10 lg:py-16 w-full">

        {/* ===== Hero (full width, auto height) ===== */}
        <section className="grid grid-cols-12 gap-8 items-center">
          {/* Left copy */}
          <div className="col-span-12 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs
                            bg-slate-900/5 text-slate-700
                            dark:bg-white/10 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5" />
              Next.js + Firebase
            </div>

            <h1 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.1]">
              Learning{" "}
              <span className="bg-gradient-to-r from-blue-600 to-fuchsia-600 bg-clip-text text-transparent">
                Tracker
              </span>
            </h1>

            <p className="mt-3 text-[clamp(1rem,1.2vw,1.125rem)] text-slate-600 dark:text-slate-300 max-w-[70ch]">
              Organize <b>courses</b>, schedule <b>lessons</b>, track <b>tasks</b>, and see your progress in one tidy place.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3
                           bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white
                           hover:from-blue-500 hover:to-fuchsia-500 shadow-lg shadow-blue-500/20 transition"
              >
                Sign in <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/auth/register"
                className="rounded-xl px-5 py-3 border
                           bg-white/70 border-slate-200 text-slate-800
                           hover:bg-white/90
                           dark:bg-slate-900/40 dark:border-slate-700 dark:text-white dark:hover:bg-slate-900/60 transition"
              >
                Register
              </Link>
            </div>

            {/* Quick points */}
            <ul className="mt-6 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                { icon: LayoutDashboard, label: 'Daily progress dashboard' },
                { icon: Shield, label: 'Auth + realtime Firestore' },
                { icon: Sparkles, label: 'Glass UI, light/dark theme' },
              ].map((i, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <i.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {i.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Right card */}
          <div className="col-span-12 lg:col-span-6">
            <div
              className="
                rounded-2xl backdrop-blur-xl p-6 md:p-8 h-full
                bg-white/80 dark:bg-slate-800/50
                border border-white/20 dark:border-slate-700/50 shadow-xl
              "
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: BookOpen, title: 'Courses', desc: 'Manage content & categories' },
                  { icon: GraduationCap, title: 'Lessons', desc: 'Study plan & schedule' },
                  { icon: ListChecks, title: 'Tasks', desc: 'Kanban + Pomodoro' },
                ].map((c, idx) => (
                  <div key={idx}
                    className="rounded-xl p-4 bg-slate-50/70 border border-slate-200
                               dark:bg-slate-900/40 dark:border-slate-700">
                    <c.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div className="mt-2 font-semibold">{c.title}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{c.desc}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl p-4
                              bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100
                              dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-900/40">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  “One app to monitor your learning—create courses, schedule lessons, and finish tasks with focus.”
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Features (full width) ===== */}
        <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen,
              title: 'Manage Courses',
              desc: 'Categories, difficulty levels, estimated hours—searchable and organized.',
            },
            {
              icon: GraduationCap,
              title: 'Lessons Planner',
              desc: 'Todo/in-progress/done statuses, due dates, and smart filters for a focused path.',
            },
            {
              icon: ListChecks,
              title: 'Task Kanban',
              desc: 'Drag & drop across statuses plus a Pomodoro timer to stay on track.',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 bg-white/80 dark:bg-slate-800/50
                         border border-white/20 dark:border-slate-700/50 backdrop-blur-xl h-full"
            >
              <f.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-slate-600 dark:text-slate-300 text-sm">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* ===== CTA (full-bleed box that scales) ===== */}
        <section className="mt-12">
          <div
            className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4
                       bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white shadow-lg"
          >
            <div className="max-w-[70ch]">
              <h4 className="text-[clamp(1.125rem,1.4vw,1.375rem)] font-bold">Ready to learn more intentionally?</h4>
              <p className="text-white/90">
                Sign in or create an account now. The dashboard adapts to your light/dark theme.
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Link
                href="/auth/login"
                className="flex-1 sm:flex-none text-center rounded-xl px-5 py-3 bg-white/15 hover:bg-white/25 transition"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="flex-1 sm:flex-none text-center rounded-xl px-5 py-3 bg-white text-slate-900 hover:bg-slate-100 transition"
              >
                Register
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
