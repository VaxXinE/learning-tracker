// src/app/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/AuthProvider';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
  BookOpen, CheckCircle2, Clock, TrendingUp, Calendar, Target, Award,
  GraduationCap, ListChecks,
} from 'lucide-react';
import { CourseService } from '@/lib/firebase/courses';
import { TaskService } from '@/lib/firebase/tasks';
import { LessonService } from '@/lib/firebase/lessons';
import type { Course } from '@/lib/firebase/courses';
import type { Task } from '@/lib/firebase/tasks';
import type { Lesson } from '@/lib/firebase/lessons';
import { Timestamp } from 'firebase/firestore';

/* ================= Small UI helpers ================= */

function GlassCard({
  children,
  className = '',
}: { children: React.ReactNode; className?: string }) {
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

function StatCard({
  title, value, icon: Icon, subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  subtitle?: string;
}) {
  return (
    <GlassCard>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          <Icon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
        </div>
      </div>
    </GlassCard>
  );
}

function ProgressRing({
  progress, size = 120, strokeWidth = 8, color = '#10b981',
}: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const r = (size - strokeWidth) / 2;
  const C = r * 2 * Math.PI;
  const offset = C - (progress / 100) * C;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="transparent"
          stroke="currentColor" strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="transparent"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${C} ${C}`} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-500"
        />
      </svg>
      <div className="absolute text-2xl font-bold text-slate-900 dark:text-white">
        {Math.round(progress)}%
      </div>
    </div>
  );
}

/* ================= Data helpers ================= */

function lessonStatus(l: Lesson): 'done' | 'in_progress' | 'todo' {
  const raw = (l as any).status as string | undefined;
  const completed = (l as any).completed as boolean | undefined;
  if (raw === 'done' || completed) return 'done';
  if (raw === 'in_progress') return 'in_progress';
  return 'todo';
}
function relevantLessonTs(l: Lesson): Timestamp | undefined {
  const any = l as any;
  return any.completedAt || any.updatedAt || any.createdAt;
}
function scheduleTs(l: Lesson): Timestamp | undefined {
  const any = l as any;
  return any.scheduledAt || any.dueDate;
}

/* ================= Page ================= */

export default function Dashboard() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const [c, l, t] = await Promise.all([
          CourseService.getCourses(user.uid),
          LessonService.getLessons(user.uid),
          TaskService.getTasks(user.uid),
        ]);
        setCourses(c);
        setLessons(l);
        setTasks(t);
      } finally {
        setIsLoading(false);
      }
    })();

    const unsubC = CourseService.subscribeToCourses(user.uid, setCourses);
    const unsubL = LessonService.subscribeToLessons(user.uid, setLessons);
    const unsubT = TaskService.subscribeToTasks(user.uid, setTasks);
    return () => { unsubC(); unsubL(); unsubT(); };
  }, [user]);

  /* ---------- derive progress from lessons ---------- */

  const lessonsByCourse = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const l of lessons) {
      const cid = (l as any).courseId as string | undefined;
      if (!cid) continue;
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push(l);
    }
    return map;
  }, [lessons]);

  const courseProgressMap = useMemo(() => {
    const out = new Map<string, number>();
    for (const c of courses) {
      const list = lessonsByCourse.get(c.id!);
      if (list?.length) {
        const done = list.filter((l) => lessonStatus(l) === 'done').length;
        out.set(c.id!, Math.round((done / list.length) * 100));
      } else {
        out.set(c.id!, c.progress ?? 0);
      }
    }
    return out;
  }, [courses, lessonsByCourse]);

  const getCourseProgress = (c: Course) => courseProgressMap.get(c.id!) ?? (c.progress ?? 0);

  /* ---------- KPIs & trends ---------- */

  const courseStats = useMemo(() => {
    const total = courses.length;
    const completed = courses.filter((c) => getCourseProgress(c) === 100).length;
    const inProgress = courses.filter((c) => {
      const p = getCourseProgress(c);
      return p > 0 && p < 100;
    }).length;
    const estHours = courses.reduce((s, c) => s + (c.estimatedHours || 0), 0);
    return { total, completed, inProgress, estHours };
  }, [courses, courseProgressMap]);

  const lessonStats = useMemo(() => {
    const total = lessons.length;
    const completed = lessons.filter((l) => lessonStatus(l) === 'done').length;
    const inProgress = total - completed;
    const upcoming = lessons
      .filter((l) => scheduleTs(l) instanceof Timestamp)
      .filter((l) => scheduleTs(l)!.toDate() > new Date()).length;
    return { total, completed, inProgress, upcoming };
  }, [lessons]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter(
      (t) => t.dueDate?.toDate?.() && t.dueDate!.toDate() < new Date() && t.status !== 'done',
    ).length;
    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const overallProgress = useMemo(() => {
    const avgCourse = courses.length
      ? courses.reduce((s, c) => s + getCourseProgress(c), 0) / courses.length
      : 0;
    const taskCompletion = taskStats.total ? (taskStats.completed / taskStats.total) * 100 : 0;
    return 0.6 * avgCourse + 0.4 * taskCompletion;
  }, [courses, courseProgressMap, taskStats]);

  const lessonTrend = useMemo(() => {
    const days: { date: string; completed: number; total: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const comp = lessons.filter((l) => {
        if (lessonStatus(l) !== 'done') return false;
        const ts = relevantLessonTs(l);
        const ds = (ts?.toDate?.() || new Date()).toISOString().slice(0, 10);
        return ds === key;
      }).length;
      const tot = Math.max(comp, comp + Math.floor(Math.random() * 2));
      days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: comp,
        total: tot,
      });
    }
    return days;
  }, [lessons]);

  const recentTasks = useMemo(() => {
    const toMs = (t: Task) =>
      (t as any).updatedAt?.toMillis?.() ?? (t as any).createdAt?.toMillis?.() ?? t.dueDate?.toMillis?.() ?? 0;
    return [...tasks].sort((a, b) => toMs(b) - toMs(a)).slice(0, 5);
  }, [tasks]);

  const upcomingLessons = useMemo(() => {
    const withDate = lessons
      .map((l) => ({ l, ts: scheduleTs(l) }))
      .filter((x) => x.ts instanceof Timestamp) as { l: Lesson; ts: Timestamp }[];
    return withDate
      .sort((a, b) => a.ts.toMillis() - b.ts.toMillis())
      .map((x) => x.l)
      .slice(0, 5);
  }, [lessons]);

  /* ---------- Theme-aware chart colors ---------- */
  const chart = useMemo(
    () => ({
      completed: isDark ? '#60a5fa' : '#3b82f6',
      total: isDark ? '#94a3b8' : '#cbd5e1',
      grid: isDark ? '#334155' : '#e2e8f0',
      tooltipBg: isDark ? 'rgba(15,23,42,0.95)' : '#ffffff',
      tooltipColor: isDark ? '#e5e7eb' : '#111827',
    }),
    [isDark],
  );

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="min-h-[100svh] md:min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
        <div className="mx-auto w-full max-w-screen-2xl space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-800/50 border border-slate-700/50 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[32vh] min-h-[260px] max-h-[420px] rounded-2xl bg-slate-800/50 border border-slate-700/50 animate-pulse" />
            <div className="h-[32vh] min-h-[260px] max-h-[420px] rounded-2xl bg-slate-800/50 border border-slate-700/50 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Render ---------- */
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
      {/* gunakan lebar penuh: max-w-screen-2xl (≈1536px) atau 2xl custom */}
      <div className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Learning Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your progress across courses, lessons, and tasks
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <StatCard title="Total Courses" value={courseStats.total} icon={BookOpen}
                    subtitle={`${courseStats.inProgress} in progress`} />
          <StatCard title="Lessons Completed" value={lessonStats.completed} icon={GraduationCap}
                    subtitle={`${lessonStats.total} lessons`} />
          <StatCard title="Tasks Completed" value={taskStats.completed} icon={CheckCircle2}
                    subtitle={`${taskStats.total} tasks`} />
          <StatCard title="Overdue Tasks" value={taskStats.overdue} icon={Clock}
                    subtitle="Need attention" />
        </div>

        {/* Chart + Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                  <TrendingUp className="text-blue-500 dark:text-blue-400" size={22} />
                  Learning Progress
                </h2>
                <div className="hidden sm:flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-blue-500" /> Completed
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-slate-400" /> Total
                  </div>
                </div>
              </div>

              {/* tingginya responsif terhadap viewport */}
              <div className="h-[32vh] min-h-[260px] max-h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lessonTrend}>
                    <defs>
                      <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chart.completed} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chart.completed} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chart.total} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chart.total} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false}
                           tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false}
                           tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: chart.tooltipBg, border: 'none', borderRadius: 12,
                        color: chart.tooltipColor, boxShadow: '0 10px 25px rgba(0,0,0,0.20)',
                      }}
                    />
                    <Area type="monotone" dataKey="total" stroke={chart.total} strokeWidth={2} fill="url(#totalGradient)" />
                    <Area type="monotone" dataKey="completed" stroke={chart.completed} strokeWidth={3} fill="url(#completedGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                <Target className="text-emerald-500" size={22} />
                Progress Overview
              </h2>

              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <ProgressRing progress={overallProgress} color="#10b981" />
                <p className="text-slate-600 dark:text-slate-400 mt-3 text-center">
                  Overall completion rate
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'Course Avg Progress',
                    value: courses.length
                      ? Math.round(courses.reduce((s, c) => s + getCourseProgress(c), 0) / courses.length)
                      : 0,
                    color: '#3b82f6',
                  },
                  { name: 'Tasks Completed', value: taskStats.completed, color: '#10b981' },
                  { name: 'Lessons Completed', value: lessonStats.completed, color: '#6366f1' },
                ].map((i, idx) => (
                  <div key={idx}
                       className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: i.color }} />
                      <span className="font-medium text-slate-700 dark:text-slate-200">{i.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{i.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/50
                              bg-gradient-to-r from-green-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="text-green-600 dark:text-green-400" size={20} />
                  <span className="font-semibold text-green-800 dark:text-green-300">Achievement</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300/90">
                  Great job! You&apos;ve completed {lessonStats.completed} lessons across {courseStats.total} courses.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Recent Activity */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <Calendar className="text-purple-500" size={22} />
              Recent Activity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Recent Tasks */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ListChecks className="text-indigo-500" size={18} /> Recent Tasks
                </h3>
                <div className="space-y-3">
                  {recentTasks.length === 0 && (
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-sm">
                      No recent tasks.
                    </div>
                  )}
                  {recentTasks.map((t) => {
                    const due = t.dueDate?.toDate?.() ?? new Date();
                    const overdue = due < new Date() && t.status !== 'done';
                    const badge =
                      t.status === 'done'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : t.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-slate-700/60 dark:text-slate-200';
                    return (
                      <div key={t.id}
                           className="p-4 rounded-lg border border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>
                              {t.status === 'done' ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'To Do'}
                            </span>
                            {overdue && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                Overdue
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {due.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                          </span>
                        </div>
                        <div className="font-medium text-slate-900 dark:text-white">{t.title}</div>
                        {t.description && (
                          <div className="text-sm text-slate-600 dark:text-slate-300/90 line-clamp-2">
                            {t.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Courses */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <BookOpen className="text-blue-500" size={18} /> Recent Courses
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {courses.slice(0, 3).map((course) => {
                    const prog = getCourseProgress(course);
                    return (
                      <div key={course.id}
                           className="p-4 rounded-lg border border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-slate-900 dark:text-white">{course.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            prog === 100
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : prog > 0
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-slate-700/60 dark:text-slate-200'
                          }`}>
                            {prog === 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'To Do'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300/90">
                          {course.category} • {course.difficulty}
                        </p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${prog}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {courses.length === 0 && (
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-sm">
                      No recent courses.
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Lessons */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <GraduationCap className="text-emerald-500" size={18} /> Upcoming Lessons
                </h3>
                <div className="space-y-3">
                  {upcomingLessons.length === 0 && (
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-sm">
                      No upcoming lessons.
                    </div>
                  )}
                  {upcomingLessons.map((l) => {
                    const when: Date = scheduleTs(l)?.toDate?.() ?? new Date();
                    const course = courses.find((c) => c.id === (l as any).courseId);
                    return (
                      <div key={(l as any).id || JSON.stringify(l)}
                           className="p-4 rounded-lg border border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {when.toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Scheduled
                          </span>
                        </div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {(l as any).title || 'Lesson'}
                        </div>
                        {course && <div className="text-sm text-slate-600 dark:text-slate-300/90">{course.title}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
