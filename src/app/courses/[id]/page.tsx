// src/app/courses/[id]/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, BookOpen, Clock, Star, Edit3, Trash2, Plus,
  GraduationCap, CheckCircle2, PlayCircle, Circle, Loader2,
} from 'lucide-react';

import { useAuth } from '@/components/AuthProvider';
import { CourseService, type Course } from '@/lib/firebase/courses';
import { LessonService, type Lesson } from '@/lib/firebase/lessons';
import { Timestamp } from 'firebase/firestore';

/* ===== Reusable GlassCard (selaras halaman lain) ===== */
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
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

/* ===== Badges (tema-aware) ===== */
const pill = {
  cat: (category?: string) =>
    `px-2 py-1 text-xs rounded-lg border ${
      category === 'Frontend'
        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
        : category === 'Backend'
        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30'
        : category === 'Mobile'
        ? 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30'
        : category === 'DevOps'
        ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30'
        : category === 'Design'
        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30'
    }`,
  diff: (difficulty?: string) =>
    `px-2 py-1 text-xs rounded-lg border ${
      difficulty === 'Advanced'
        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'
        : difficulty === 'Intermediate'
        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
    }`,
  status: (s: string) =>
    `px-2 py-1 rounded-md text-[11px] border ${
      s === 'done'
        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30'
        : s === 'in_progress'
        ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
        : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30'
    }`,
};

export default function CourseDetailPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [deleting, setDeleting] = useState(false);

  // quick add lesson modal
  const [showCreate, setShowCreate] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in_progress' | 'done',
    type: 'reading' as 'reading' | 'video' | 'project' | 'quiz',
    estimatedTime: 30,
    dueDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!user || !id) return;

    setLoading(true);

    // subscribe all courses then pick one
    const unsubC = CourseService.subscribeToCourses(user.uid, (list) => {
      const found = list.find((c) => c.id === id) || null;
      setCourse(found || null);
      setLoading(false);
    });

    // subscribe lessons then filter by courseId
    const unsubL = LessonService.subscribeToLessons(user.uid, (list) => {
      setLessons(list.filter((l: any) => (l as any).courseId === id));
    });

    return () => { unsubC?.(); unsubL?.(); };
  }, [user, id]);

  const stats = useMemo(() => {
    const total = lessons.length;
    const done = lessons.filter((l: any) => l.status === 'done' || (l as any).completed)?.length || 0;
    const inProgress = lessons.filter((l: any) => l.status === 'in_progress')?.length || 0;
    const progress = total ? Math.round((done / total) * 100) : 0;
    const est = course?.estimatedHours ?? Math.round(lessons.reduce((a, l: any) => a + (l.estimatedTime || 0), 0) / 60);
    return { total, done, inProgress, progress, est };
  }, [lessons, course]);

  async function handleDeleteCourse() {
    if (!course?.id) return;
    if (!confirm('Delete this course? This action cannot be undone.')) return;
    try {
      setDeleting(true);
      await CourseService.deleteCourse(course.id);
      router.push('/courses');
    } finally {
      setDeleting(false);
    }
  }

  async function createLesson() {
    if (!user || !course?.id || !newLesson.title.trim()) return;
    await LessonService.createLesson(
      {
        title: newLesson.title,
        description: newLesson.description,
        courseId: course.id,
        status: newLesson.status,
        type: newLesson.type,
        estimatedTime: newLesson.estimatedTime,
        dueDate: new Date(newLesson.dueDate),
      } as any,
      user.uid
    );
    setShowCreate(false);
    setNewLesson({
      title: '',
      description: '',
      status: 'todo',
      type: 'reading',
      estimatedTime: 30,
      dueDate: new Date().toISOString().split('T')[0],
    });
  }

  async function setLessonStatus(lessonId: string, status: 'todo'|'in_progress'|'done') {
    await LessonService.updateLesson(lessonId, { status } as any);
  }

  /* ---------- Render ---------- */

  if (!user) {
    return (
      <div className="min-h-[100svh] grid place-items-center px-6
                      bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
                      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GlassCard><div className="p-8 text-center">Please sign in to view this course.</div></GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[100svh] px-3 sm:px-4 md:px-6 py-4 sm:py-6
                      bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
                      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-10 w-40 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <GlassCard key={i}><div className="h-28 animate-pulse bg-slate-200/60 dark:bg-slate-700/50 rounded-2xl" /></GlassCard>
            ))}
          </div>
          <GlassCard><div className="h-96 animate-pulse bg-slate-200/60 dark:bg-slate-700/50 rounded-2xl" /></GlassCard>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[100svh] grid place-items-center px-6
                      bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
                      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GlassCard>
          <div className="p-10 text-center">
            <div className="text-2xl font-bold">404</div>
            <p className="text-slate-600 dark:text-slate-400">Course not found.</p>
            <Link href="/courses" className="inline-flex mt-4 items-center gap-2 text-blue-600 dark:text-blue-400">
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
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
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/courses" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Courses
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Lesson
            </button>
            <button
              onClick={handleDeleteCourse}
              disabled={deleting}
              className="px-3 py-2 rounded-xl border bg-red-50 hover:bg-red-100 text-red-700
                         dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30 dark:border-red-500/30 inline-flex items-center gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>

        {/* Header card */}
        <GlassCard>
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Course
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
                {course.description && (
                  <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-3xl">
                    {course.description}
                  </p>
                )}
              </div>
              {course.featured && (
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  <Star className="w-3.5 h-3.5 inline mr-1" />
                  Featured
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={pill.cat(course.category)}>{course.category || 'General'}</span>
              <span className={pill.diff(course.difficulty)}>{course.difficulty || 'Beginner'}</span>
              <span className="px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                {stats.est || 0}h est.
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Lessons</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Completed</p>
                <p className="text-2xl font-bold">{stats.done}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Progress</p>
                <p className="text-2xl font-bold">{stats.progress}%</p>
              </div>
              <PlayCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </GlassCard>
        </div>

        {/* Lessons list */}
        <GlassCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" /> Lessons
              </h2>
              <button
                onClick={() => setShowCreate(true)}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Lesson
              </button>
            </div>

            {lessons.length === 0 ? (
              <div className="text-sm text-slate-600 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6">
                No lessons yet. Create your first one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {lessons
                  .slice()
                  .sort((a: any, b: any) => {
                    const da = (a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0);
                    const db = (b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0);
                    return db - da;
                  })
                  .map((l) => {
                    const due: Date | undefined =
                      (l as any).dueDate?.toDate?.() ??
                      (typeof (l as any).dueDate === 'string' ? new Date((l as any).dueDate) : undefined);

                    return (
                      <GlassCard key={l.id}>
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold">{l.title}</h3>
                            <span className={pill.status(l.status)}>
                              {l.status === 'in_progress' ? 'In Progress' : l.status === 'done' ? 'Done' : 'To Do'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{l.description}</p>

                          <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900/50">{(l as any).type || 'reading'}</span>
                            {(l as any).estimatedTime ? <span>{(l as any).estimatedTime}m</span> : null}
                            {due && (
                              <span>
                                • {due.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex items-center gap-2">
                            <button
                              onClick={() => setLessonStatus(l.id!, 'todo')}
                              className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700/40 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] inline-flex items-center gap-1"
                            >
                              <Circle className="w-3 h-3" /> To Do
                            </button>
                            <button
                              onClick={() => setLessonStatus(l.id!, 'in_progress')}
                              className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700/40 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] inline-flex items-center gap-1"
                            >
                              <PlayCircle className="w-3 h-3" /> In Progress
                            </button>
                            <button
                              onClick={() => setLessonStatus(l.id!, 'done')}
                              className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700/40 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Create Lesson Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-lg">
            <GlassCard>
              <div className="p-6 border-b border-white/20 dark:border-slate-700/50">
                <h3 className="text-lg font-semibold">Add Lesson to “{course.title}”</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Title</label>
                  <input
                    value={newLesson.title}
                    onChange={(e) => setNewLesson((v) => ({ ...v, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Lesson title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson((v) => ({ ...v, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Status</label>
                    <select
                      value={newLesson.status}
                      onChange={(e) => setNewLesson((v) => ({ ...v, status: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Type</label>
                    <select
                      value={newLesson.type}
                      onChange={(e) => setNewLesson((v) => ({ ...v, type: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="reading">Reading</option>
                      <option value="video">Video</option>
                      <option value="project">Project</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Est. (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={newLesson.estimatedTime}
                      onChange={(e) => setNewLesson((v) => ({ ...v, estimatedTime: parseInt(e.target.value || '30', 10) }))}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Due date</label>
                  <input
                    type="date"
                    value={newLesson.dueDate}
                    onChange={(e) => setNewLesson((v) => ({ ...v, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-white/20 dark:border-slate-700/50 flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-3 rounded-xl border bg-gray-100 hover:bg-gray-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={createLesson}
                  disabled={!newLesson.title.trim()}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-50"
                >
                  Create Lesson
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
