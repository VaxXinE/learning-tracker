// src/app/search/page.tsx
'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, NotebookText, KanbanSquare } from 'lucide-react';

import { Course, CourseService } from '@/lib/firebase/courses';
import { Lesson, LessonService } from '@/lib/firebase/lessons';
import { Task, TaskService } from '@/lib/firebase/tasks';

type Scope = 'all' | 'courses' | 'lessons' | 'tasks';

/* ==== Extra typings untuk hindari `any` pada Lesson ==== */
type LessonExtra = {
  type?: 'reading' | 'video' | 'project' | 'quiz';
  status?: 'todo' | 'in_progress' | 'done';
  courseId?: string;
  estimatedTime?: number;
};
const asLessonExtra = (l: Lesson): LessonExtra => l as unknown as LessonExtra;

/* ===== Reusable GlassCard ===== */
function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        'rounded-2xl backdrop-blur-xl',
        'bg-white/80 dark:bg-slate-800/50',
        'border border-white/20 dark:border-slate-700/50',
        'shadow-lg', className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/* ===== Section wrapper: kirimkan `isEmpty` eksplisit ===== */
function Section({
  title,
  icon,
  emptyText,
  isEmpty,
  children,
}: {
  title: string;
  icon: ReactNode;
  emptyText: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {isEmpty ? (
        <GlassCard>
          <div className="p-6 text-sm text-slate-600 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            {emptyText}
          </div>
        </GlassCard>
      ) : (
        children
      )}
    </section>
  );
}

export default function GlobalSearchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const q = (params.get('q') || '').trim();
  const scope = ((params.get('scope') as Scope) || 'all');

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [c, l, t] = await Promise.all([
          CourseService.getCourses(user.uid),
          LessonService.getLessons(user.uid),
          TaskService.getTasks(user.uid),
        ]);
        if (!cancelled) {
          setCourses(c);
          setLessons(l);
          setTasks(t);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const norm = (s: string) => s.toLowerCase();
  const matches = (text?: string) => (q ? norm(text || '').includes(norm(q)) : true);

  const filtered = useMemo(() => {
    const fc = courses.filter((c) =>
      matches(c.title) || matches(c.description) || matches(c.category) || matches(c.difficulty),
    );
    const fl = lessons.filter((l) => {
      const lx = asLessonExtra(l);
      return matches(l.title) || matches(l.description) || matches(lx.type) || matches(lx.status);
    });
    const ft = tasks.filter((t) =>
      matches(t.title) || matches(t.description) || (t.tags || []).some((tag) => matches(tag)),
    );
    return { fc, fl, ft };
  }, [courses, lessons, tasks, q]);

  const totalCount =
    (scope === 'all' ? filtered.fc.length : 0) +
    (scope === 'all' ? filtered.fl.length : 0) +
    (scope === 'all' ? filtered.ft.length : 0);

  const onScope = (s: Scope) => {
    const usp = new URLSearchParams(params.toString());
    usp.set('scope', s);
    router.replace(`/search?${usp.toString()}`);
  };

  if (!user) {
    return (
      <div className="min-h-[100svh] grid place-items-center px-6
                      bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
                      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GlassCard>
          <div className="p-8 text-center text-slate-700 dark:text-slate-200">
            Please sign in to use search.
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div
      className="
        min-h-[100svh] md:min-h-dvh w-full overflow-x-hidden
        px-3 sm:px-4 md:px-6 py-4 sm:py-6
        bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
        dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
        text-slate-900 dark:text-white
      "
    >
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl md:text-3xl font-bold">Search</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {q ? <>Results for <span className="font-semibold text-slate-900 dark:text-white">&ldquo;{q}&rdquo;</span></> : 'Type a query in the top search bar'}
          </p>
        </div>

        {/* Scope Tabs */}
        <GlassCard>
          <div className="p-4 flex items-center gap-2 flex-wrap">
            {([
              { key: 'all', label: 'All' },
              { key: 'courses', label: 'Courses' },
              { key: 'lessons', label: 'Lessons' },
              { key: 'tasks', label: 'Tasks' },
            ] as { key: Scope; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => onScope(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  scope === t.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-transparent text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <GlassCard key={i}>
                <div className="p-6 space-y-3 animate-pulse">
                  <div className="h-5 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-2/4 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <>
            {(scope === 'all' || scope === 'courses') && (
              <Section
                title="Courses"
                icon={<BookOpen className="h-5 w-5 text-blue-500" />}
                emptyText={q ? 'No courses match your query.' : 'Start by typing something above.'}
                isEmpty={filtered.fc.length === 0}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.fc.map((c) => (
                    <GlassCard key={c.id}>
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{c.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{c.description}</p>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs border bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20">
                            {c.category}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900/50">{c.difficulty}</span>
                          <span>{c.estimatedHours ?? 0}h</span>
                        </div>
                        <div className="mt-4">
                          <Link
                            href={`/courses/${c.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </Section>
            )}

            {(scope === 'all' || scope === 'lessons') && (
              <Section
                title="Lessons"
                icon={<NotebookText className="h-5 w-5 text-purple-500" />}
                emptyText={q ? 'No lessons match your query.' : 'Start by typing something above.'}
                isEmpty={filtered.fl.length === 0}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.fl.map((l) => {
                    const lx = asLessonExtra(l);
                    const courseHref = lx.courseId ? `/courses/${lx.courseId}` : '#';
                    return (
                      <GlassCard key={l.id}>
                        <div className="p-6">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{l.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{l.description}</p>
                          <div className="mt-3 flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-1 rounded ${
                                l.status === 'done'
                                  ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                  : l.status === 'in_progress'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {l.status}
                            </span>
                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300">
                              {lx.type || 'reading'}
                            </span>
                            {typeof lx.estimatedTime === 'number' ? <span>{lx.estimatedTime}m</span> : null}
                          </div>
                          <div className="mt-4">
                            <Link
                              href={courseHref}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700"
                            >
                              Open Course
                            </Link>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </Section>
            )}

            {(scope === 'all' || scope === 'tasks') && (
              <Section
                title="Tasks"
                icon={<KanbanSquare className="h-5 w-5 text-emerald-500" />}
                emptyText={q ? 'No tasks match your query.' : 'Start by typing something above.'}
                isEmpty={filtered.ft.length === 0}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.ft.map((t) => (
                    <GlassCard key={t.id}>
                      <div className="p-6">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{t.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{t.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`px-2 py-1 rounded ${
                              t.status === 'done'
                                ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                : t.status === 'in_progress'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {t.status}
                          </span>
                          <span
                            className={`px-2 py-1 rounded ${
                              t.priority === 'high'
                                ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                : t.priority === 'medium'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {t.priority}
                          </span>
                          {(t.tags || []).slice(0, 3).map((tag) => (
                            <span
                              key={`${t.id}-${tag}`}
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4">
                          <Link
                            href="/tasks"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                          >
                            Open Kanban
                          </Link>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </Section>
            )}

            {scope === 'all' && q && totalCount === 0 && (
              <GlassCard>
                <div className="p-10 text-center text-slate-600 dark:text-slate-400">
                  No results. Try different keywords.
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
