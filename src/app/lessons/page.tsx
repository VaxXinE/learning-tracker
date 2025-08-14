'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { LessonService, Lesson } from '@/lib/firebase/lessons';
import { CourseService, Course } from '@/lib/firebase/courses';
import {
  Plus, Search, Trash2, Clock, Edit3, BookOpen, CheckCircle2, PlayCircle, Circle, Filter,
} from 'lucide-react';

type LessonStatus = 'todo' | 'in_progress' | 'done';
type LessonPriority = 'low' | 'medium' | 'high';
type LessonType = 'reading' | 'video' | 'project' | 'quiz';

interface LessonForm {
  title: string;
  description: string;
  courseId: string;
  status: LessonStatus;
  priority: LessonPriority;
  type: LessonType;
  estimatedTime: number;
  dueDate: string; // YYYY-MM-DD
}

/* ===== Reusable glass card (selaras dashboard) ===== */
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

export default function LessonsPage() {
  const { user } = useAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // filters / search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState<'All' | string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | LessonStatus>('All');

  // create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLesson, setNewLesson] = useState<LessonForm>({
    title: '',
    description: '',
    courseId: '',
    status: 'todo',
    priority: 'medium',
    type: 'reading',
    estimatedTime: 30,
    dueDate: new Date().toISOString().split('T')[0],
  });

  // edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);
        const [ls, cs] = await Promise.all([
          LessonService.getLessons(user.uid),
          CourseService.getCourses(user.uid),
        ]);
        setLessons(ls);
        setCourses(cs);
      } catch (e) {
        console.error('Error loading data:', e);
      } finally {
        setLoading(false);
      }
    })();

    const unsubL = LessonService.subscribeToLessons(user.uid, setLessons);
    const unsubC = CourseService.subscribeToCourses(user.uid, setCourses);
    return () => {
      unsubL();
      unsubC();
    };
  }, [user]);

  /* ===== Derived ===== */
  const filteredLessons = useMemo(() => {
    return lessons
      .filter((l) => {
        const q = searchQuery.trim().toLowerCase();
        const matchQ = !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q);
        const matchCourse = filterCourse === 'All' || l.courseId === filterCourse;
        const matchStatus = filterStatus === 'All' || l.status === filterStatus;
        return matchQ && matchCourse && matchStatus;
      })
      .sort((a, b) => {
        const da = (a as any).updatedAt?.toMillis?.() ?? (a as any).createdAt?.toMillis?.() ?? 0;
        const db = (b as any).updatedAt?.toMillis?.() ?? (b as any).createdAt?.toMillis?.() ?? 0;
        return db - da;
      });
  }, [lessons, searchQuery, filterCourse, filterStatus]);

  const courseMap = useMemo(() => {
    const m = new Map<string, Course>();
    courses.forEach((c) => c.id && m.set(c.id, c));
    return m;
  }, [courses]);

  /* ===== Mutations ===== */
  const handleCreateLesson = async () => {
    if (!user || !newLesson.title.trim() || !newLesson.courseId) return;
    try {
      await LessonService.createLesson(
        { ...newLesson, dueDate: new Date(newLesson.dueDate) } as any,
        user.uid
      );
      setShowCreateModal(false);
      setNewLesson({
        title: '',
        description: '',
        courseId: '',
        status: 'todo',
        priority: 'medium',
        type: 'reading',
        estimatedTime: 30,
        dueDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error creating lesson:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!user) return;
    try {
      await LessonService.deleteLesson(lessonId);
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  const handleChangeStatus = async (lessonId: string, status: LessonStatus) => {
    try {
      await LessonService.updateLesson(lessonId, { status });
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const openEdit = (l: Lesson) => {
    setEditLesson(l);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editLesson?.id) return;
    setSavingEdit(true);
    try {
      const payload: Partial<Lesson> = {
        title: editLesson.title,
        description: editLesson.description,
        courseId: (editLesson as any).courseId,
        status: editLesson.status,
        priority: (editLesson as any).priority ?? 'medium',
        type: (editLesson as any).type ?? 'reading',
        estimatedTime: (editLesson as any).estimatedTime ?? 30,
        dueDate: new Date(
          ((editLesson as any).dueDateString as string) ||
          (editLesson as any).dueDate?.toDate?.()?.toISOString()?.split('T')[0] ||
          new Date().toISOString().split('T')[0]
        ) as any,
      };
      await LessonService.updateLesson(editLesson.id, payload as any);
      setShowEditModal(false);
    } catch (e) {
      console.error('Error saving edit:', e);
    } finally {
      setSavingEdit(false);
    }
  };

  /* ===== UI helpers (theme-aware badges) ===== */
  const statusBadge = (s: LessonStatus) => {
    switch (s) {
      case 'done':
        return 'border bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30';
      case 'in_progress':
        return 'border bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
      default:
        return 'border bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30';
    }
  };

  const priorityBadge = (p: LessonPriority) => {
    switch (p) {
      case 'high':
        return 'border bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30';
      case 'low':
        return 'border bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
      default:
        return 'border bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
    }
  };

  const inputBase =
    'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
    'bg-white/80 dark:bg-slate-900/50 border-gray-200 dark:border-slate-600 ' +
    'text-slate-900 dark:text-white placeholder-slate-400';

  /* ===== Loading (full-bleed & theme-aware) ===== */
  if (loading) {
    return (
      <div className="min-h-[100svh] md:min-h-dvh w-full grid place-items-center px-6
                      bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
                      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
      </div>
    );
  }

  /* ===== Render (full-bleed, responsive) ===== */
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
      {/* max width like dashboard; remove local breadcrumb/title */}
      <div className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[1600px] space-y-6">
        {/* Controls (with Add button on the right) */}
        <GlassCard>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-3 w-full md:flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputBase} pl-10`}
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value as any)}
                    className={inputBase}
                  >
                    <option value="All">All Courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className={inputBase}
                  >
                    <option value="All">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>

                  <div className="hidden md:flex items-center text-slate-400 px-3">
                    <Filter className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Lesson
                </span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => {
            const c = courseMap.get(lesson.courseId || '');
            const due =
              (lesson as any).dueDate?.toDate?.() ??
              (typeof (lesson as any).dueDate === 'string'
                ? new Date((lesson as any).dueDate)
                : undefined);

            return (
              <GlassCard key={lesson.id}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {lesson.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] ${priorityBadge(
                            (lesson as any).priority || 'medium'
                          )}`}
                        >
                          {(lesson as any).priority || 'medium'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 line-clamp-2">
                        {lesson.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(lesson)}
                        className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/60"
                        title="Edit lesson"
                      >
                        <Edit3 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id!)}
                        className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/60"
                        title="Delete lesson"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs mb-3">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {c?.title ?? 'Unknown course'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{(lesson as any).estimatedTime || 30}m</span>
                    {due && (
                      <>
                        <span>•</span>
                        <span>
                          {due.toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                          })}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-md text-[11px] ${statusBadge(
                        lesson.status
                      )}`}
                    >
                      {lesson.status === 'in_progress'
                        ? 'In Progress'
                        : lesson.status === 'done'
                        ? 'Done'
                        : 'To Do'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleChangeStatus(lesson.id!, 'todo')}
                        className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700/40 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] flex items-center gap-1"
                        title="Mark To Do"
                      >
                        <Circle className="w-3 h-3" /> To Do
                      </button>
                      <button
                        onClick={() => handleChangeStatus(lesson.id!, 'in_progress')}
                        className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700/40 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] flex items-center gap-1"
                        title="Mark In Progress"
                      >
                        <PlayCircle className="w-3 h-3" /> In Progress
                      </button>
                      <button
                        onClick={() => handleChangeStatus(lesson.id!, 'done')}
                        className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700/40 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] flex items-center gap-1"
                        title="Mark Done"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {filteredLessons.length === 0 && !loading && (
          <GlassCard>
            <div className="text-center py-12 px-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No lessons found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchQuery || filterCourse !== 'All' || filterStatus !== 'All'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first lesson.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20"
                >
                  Create First Lesson
                </button>
              )}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <GlassCard>
              <div className="p-6 border-b border-white/20 dark:border-slate-700/50">
                <h2 className="text-xl font-semibold">Create New Lesson</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    className={inputBase}
                    placeholder="Lesson title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    className={`${inputBase} resize-none`}
                    rows={3}
                    placeholder="Lesson description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Course
                    </label>
                    <select
                      value={newLesson.courseId}
                      onChange={(e) => setNewLesson({ ...newLesson, courseId: e.target.value })}
                      className={inputBase}
                    >
                      <option value="">Select a course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      value={newLesson.status}
                      onChange={(e) => setNewLesson({ ...newLesson, status: e.target.value as LessonStatus })}
                      className={inputBase}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Priority
                    </label>
                    <select
                      value={newLesson.priority}
                      onChange={(e) => setNewLesson({ ...newLesson, priority: e.target.value as LessonPriority })}
                      className={inputBase}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Type
                    </label>
                    <select
                      value={newLesson.type}
                      onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value as LessonType })}
                      className={inputBase}
                    >
                      <option value="reading">Reading</option>
                      <option value="video">Video</option>
                      <option value="project">Project</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Est. Time (min)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newLesson.estimatedTime}
                      onChange={(e) => setNewLesson({ ...newLesson, estimatedTime: parseInt(e.target.value) || 1 })}
                      className={inputBase}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newLesson.dueDate}
                    onChange={(e) => setNewLesson({ ...newLesson, dueDate: e.target.value })}
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/20 dark:border-slate-700/50 flex gap-3">
                <button
                  onClick={handleCreateLesson}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50"
                  disabled={!newLesson.title.trim() || !newLesson.courseId}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-900 rounded-xl dark:bg-slate-600 dark:hover:bg-slate-700 dark:text-white"
                >
                  Cancel
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editLesson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <GlassCard>
              <div className="p-6 border-b border-white/20 dark:border-slate-700/50">
                <h2 className="text-xl font-semibold">Edit Lesson</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editLesson.title}
                    onChange={(e) => setEditLesson({ ...editLesson, title: e.target.value })}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    value={editLesson.description}
                    onChange={(e) => setEditLesson({ ...editLesson, description: e.target.value })}
                    rows={3}
                    className={`${inputBase} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Course
                    </label>
                    <select
                      value={(editLesson as any).courseId || ''}
                      onChange={(e) => setEditLesson({ ...(editLesson as any), courseId: e.target.value })}
                      className={inputBase}
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      value={editLesson.status}
                      onChange={(e) => setEditLesson({ ...editLesson, status: e.target.value as LessonStatus })}
                      className={inputBase}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Priority
                    </label>
                    <select
                      value={(editLesson as any).priority || 'medium'}
                      onChange={(e) => setEditLesson({ ...(editLesson as any), priority: e.target.value as LessonPriority })}
                      className={inputBase}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Type
                    </label>
                    <select
                      value={(editLesson as any).type || 'reading'}
                      onChange={(e) => setEditLesson({ ...(editLesson as any), type: e.target.value as LessonType })}
                      className={inputBase}
                    >
                      <option value="reading">Reading</option>
                      <option value="video">Video</option>
                      <option value="project">Project</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Est. Time (min)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={(editLesson as any).estimatedTime || 30}
                      onChange={(e) => setEditLesson({ ...(editLesson as any), estimatedTime: parseInt(e.target.value) || 1 })}
                      className={inputBase}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={
                      (editLesson as any).dueDate?.toDate?.()?.toISOString()?.split('T')[0] ??
                      ((editLesson as any).dueDateString as string) ??
                      new Date().toISOString().split('T')[0]
                    }
                    onChange={(e) => setEditLesson({ ...(editLesson as any), dueDateString: e.target.value } as any)}
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/20 dark:border-slate-700/50 flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-900 rounded-xl dark:bg-slate-600 dark:hover:bg-slate-700 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
