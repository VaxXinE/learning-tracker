// src/app/courses/page.tsx  (atau sesuai path file Anda)
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Search, Plus, BookOpen, Trash2, Edit3, Eye, Calendar, Clock, Star, Filter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Course, CourseService } from '@/lib/firebase/courses';
import { Lesson, LessonService } from '@/lib/firebase/lessons';
import { useAuth } from '@/components/AuthProvider';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type LessonStatus = 'todo' | 'in_progress' | 'done';

type LessonStats = {
  total: number;
  done: number;
  in_progress: number;
  todo: number;
};

/* ===== Reusable glass card ===== */
function GlassCard({
  children, className = '',
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

/* ===== Helpers: akses field tambahan dengan aman (tanpa any) ===== */
type LessonExtra = {
  courseId?: string;
  estimatedTime?: number;
};
type CourseExtra = {
  featured?: boolean;
  lastAccessed?: unknown; // Date | string | number | firestore Timestamp
};

function getLessonExtra(l: Lesson): LessonExtra {
  return l as unknown as LessonExtra;
}
function getCourseExtra(c: Course): CourseExtra {
  return c as unknown as CourseExtra;
}
type WithToDate = { toDate?: () => Date };
function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'object' && value !== null && 'toDate' in (value as WithToDate)) {
    try {
      const d = (value as WithToDate).toDate?.();
      return d instanceof Date ? d : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
function toMillis(value: unknown): number {
  const d = toDate(value);
  return d ? d.getTime() : 0;
}

export default function EnhancedCoursesUI(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState<{
    title: string;
    description: string;
    category: string;
    difficulty: Difficulty;
    estimatedHours: number;
  }>({
    title: '',
    description: '',
    category: 'Frontend',
    difficulty: 'Beginner',
    estimatedHours: 0,
  });

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCourseData, setEditCourseData] = useState<Course | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const categories = ['All', 'Frontend', 'Backend', 'Design', 'DevOps', 'Mobile'];
  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  // Load + realtime subscribe
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubCourses = CourseService.subscribeToCourses(user.uid, (updatedCourses) => {
      setCourses(updatedCourses);
      setLoading(false);
    });
    const unsubLessons = LessonService.subscribeToLessons(user.uid, (updatedLessons) => {
      setLessons(updatedLessons);
    });

    return () => {
      unsubCourses?.();
      unsubLessons?.();
    };
  }, [user]);

  // ---- Derivatives dari lessons ----
  const lessonStatsByCourseId = useMemo(() => {
    const map = new Map<string, LessonStats>();
    for (const l of lessons) {
      const cid = getLessonExtra(l).courseId || '';
      if (!cid) continue;
      if (!map.has(cid)) {
        map.set(cid, { total: 0, done: 0, in_progress: 0, todo: 0 });
      }
      const stats = map.get(cid)!;
      stats.total += 1;
      const s: LessonStatus = l.status;
      if (s === 'done') stats.done += 1;
      else if (s === 'in_progress') stats.in_progress += 1;
      else stats.todo += 1;
    }
    return map;
  }, [lessons]);

  const getDerivedLessonsCount = (courseId?: string): number =>
    (courseId && lessonStatsByCourseId.get(courseId)?.total) || 0;

  const getDerivedProgress = (courseId?: string): number => {
    if (!courseId) return 0;
    const stats = lessonStatsByCourseId.get(courseId);
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.done / stats.total) * 100);
  };

  // ---- Filtering & sorting ----
  const filteredAndSortedCourses = useMemo(() => {
    const filtered = courses.filter((course) => {
      const title = (course.title || '').toLowerCase();
      const desc = (course.description || '').toLowerCase();
      const matchesSearch =
        title.includes(searchQuery.toLowerCase()) ||
        desc.includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          return getDerivedProgress(b.id) - getDerivedProgress(a.id);
        case 'recent':
        default: {
          const aMs = toMillis(getCourseExtra(a).lastAccessed);
          const bMs = toMillis(getCourseExtra(b).lastAccessed);
          return bMs - aMs;
        }
      }
    });
  }, [courses, searchQuery, selectedCategory, sortBy, lessonStatsByCourseId]);

  // ---- KPI cards ----
  const kpi = useMemo(() => {
    const total = courses.length;
    const completed = courses.filter((c) => getDerivedProgress(c.id) === 100).length;
    const inProgress = courses.filter((c) => {
      const p = getDerivedProgress(c.id);
      return p > 0 && p < 100;
    }).length;
    const totalHours = courses.reduce((acc, c) => acc + (c.estimatedHours || 0), 0);
    return { total, completed, inProgress, totalHours };
  }, [courses, lessonStatsByCourseId]);

  // Create
  const handleCreateCourse = async () => {
    if (!user || !newCourse.title.trim()) return;
    try {
      await CourseService.createCourse(newCourse as unknown as Course, user.uid);
      setNewCourse({
        title: '',
        description: '',
        category: 'Frontend',
        difficulty: 'Beginner',
        estimatedHours: 0,
      });
      setShowCreateModal(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating course:', error);
    }
  };

  // Delete
  const handleDeleteCourse = async (courseId: string) => {
    if (!user) return;
    try {
      await CourseService.deleteCourse(courseId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting course:', error);
    }
  };

  // View
  const handleViewCourse = (courseId?: string) => {
    if (!courseId) return;
    router.push(`/courses/${courseId}`);
  };

  // Edit open
  const handleEditCourse = (course: Course) => {
    setEditCourseData(course);
    setShowEditModal(true);
  };

  // Edit save
  const handleSaveEdit = async () => {
    if (!editCourseData?.id) return;
    setSavingEdit(true);
    try {
      const { title, description, category, difficulty, estimatedHours } = editCourseData;
      const featured = getCourseExtra(editCourseData).featured ?? false;

      await CourseService.updateCourse(editCourseData.id, {
        title,
        description,
        category,
        difficulty,
        estimatedHours,
        featured,
      });

      setShowEditModal(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating course:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  /* ===== Theme-aware pill helpers ===== */
  const diffPill = (difficulty: string): string => {
    const map: Record<string, string> = {
      Beginner:
        'border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
      Intermediate:
        'border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
      Advanced:
        'border bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
    };
    return (
      map[difficulty] ||
      'border bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30'
    );
  };

  const catPill = (category: string): string => {
    const map: Record<string, string> = {
      Frontend:
        'border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
      Backend:
        'border bg-green-50 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30',
      Design:
        'border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
      DevOps:
        'border bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
      Mobile:
        'border bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30',
    };
    return (
      map[category] ||
      'border bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30'
    );
  };

  const inputBase =
    'px-4 py-3 rounded-xl border bg-white/80 dark:bg-slate-900/50 ' +
    'border-gray-200 dark:border-slate-600 text-slate-900 dark:text-white ' +
    'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (loading) {
    return (
      <div className="min-h-[100svh] md:min-h-dvh p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-slate-600 dark:text-slate-300">Loading courses...</p>
        </div>
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
      <div className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[1600px] space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <GlassCard>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total Courses</p>
                <p className="text-2xl font-bold">{kpi.total}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Completed</p>
                <p className="text-2xl font-bold">{kpi.completed}</p>
              </div>
              <Star className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">In Progress</p>
                <p className="text-2xl font-bold">{kpi.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold">{kpi.totalHours}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
          </GlassCard>
        </div>

        {/* Controls */}
        <GlassCard>
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputBase} w-full pl-10 transition-all duration-200`}
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={inputBase}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className={inputBase}
                  >
                    <option value="recent">Recent</option>
                    <option value="title">Title</option>
                    <option value="progress">Progress</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="px-4 py-3 rounded-xl border bg-gray-100 hover:bg-gray-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-600 transition-all duration-200 flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {viewMode === 'grid' ? 'List' : 'Grid'}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold text-white shadow-lg shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Create Course
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Courses Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCourses.map((course) => {
              const progress = getDerivedProgress(course.id);
              const lessonsCount = getDerivedLessonsCount(course.id);
              const featured = getCourseExtra(course).featured ?? false;

              return (
                <GlassCard key={course.id} className="hover:shadow-xl transition-all">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{course.title}</h3>
                          {featured && (
                            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-current" />
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2 mb-4">
                      <span className={`px-2 py-1 text-xs rounded-lg ${catPill(course.category)}`}>
                        {course.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-lg ${diffPill(course.difficulty)}`}>
                        {course.difficulty}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Progress</span>
                        <span className="text-sm font-semibold">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="text-slate-600 dark:text-slate-300">
                        <BookOpen className="w-4 h-4 inline mr-1" />
                        {lessonsCount} lessons
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {course.estimatedHours}h total
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewCourse(course.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="px-3 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-600 transition-colors"
                        aria-label="Edit course"
                        title="Edit course"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-3 py-2 rounded-lg border bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-300 dark:border-red-500/30 transition-colors"
                        aria-label="Delete course"
                        title="Delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <GlassCard>
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left p-6 text-slate-700 dark:text-slate-300 font-semibold">Course</th>
                    <th className="text-left p-6 text-slate-700 dark:text-slate-300 font-semibold">Category</th>
                    <th className="text-left p-6 text-slate-700 dark:text-slate-300 font-semibold">Progress</th>
                    <th className="text-left p-6 text-slate-700 dark:text-slate-300 font-semibold">Lessons</th>
                    <th className="text-center p-6 text-slate-700 dark:text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCourses.map((course) => {
                    const p = getDerivedProgress(course.id);
                    const lessonsCount = getDerivedLessonsCount(course.id);
                    const featured = getCourseExtra(course).featured ?? false;

                    return (
                      <tr
                        key={course.id}
                        className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-6">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{course.title}</h3>
                              {featured && (
                                <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-current" />
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
                              {course.description}
                            </p>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 text-xs rounded-lg ${catPill(course.category)}`}>
                              {course.category}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-lg ${diffPill(course.difficulty)}`}>
                              {course.difficulty}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-20 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                                style={{ width: `${p}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{p}%</span>
                          </div>
                        </td>
                        <td className="p-6">{lessonsCount}</td>
                        <td className="p-6">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleViewCourse(course.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="px-3 py-1 rounded-lg border bg-gray-100 hover:bg-gray-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-600 transition-colors"
                              aria-label="Edit course"
                              title="Edit course"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="px-3 py-1 rounded-lg border bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-300 dark:border-red-500/30 transition-colors"
                              aria-label="Delete course"
                              title="Delete course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {filteredAndSortedCourses.length === 0 && (
          <GlassCard>
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first course'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 font-semibold text-white"
              >
                Create Your First Course
              </button>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <GlassCard>
              <div className="p-6 border-b border-white/20 dark:border-slate-700/50">
                <h2 className="text-xl font-semibold">Create New Course</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Title</label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, title: e.target.value }))}
                    className={`${inputBase} w-full`}
                    placeholder="Enter course title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`${inputBase} w-full resize-none`}
                    placeholder="Enter course description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse((prev) => ({ ...prev, category: e.target.value }))}
                      className={inputBase}
                    >
                      {categories.slice(1).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Difficulty</label>
                    <select
                      value={newCourse.difficulty}
                      onChange={(e) =>
                        setNewCourse((prev) => ({ ...prev, difficulty: e.target.value as Difficulty }))
                      }
                      className={inputBase}
                    >
                      {difficulties.map((diff) => (
                        <option key={diff} value={diff}>
                          {diff}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Estimated Hours</label>
                  <input
                    type="number"
                    value={newCourse.estimatedHours}
                    onChange={(e) =>
                      setNewCourse((prev) => ({
                        ...prev,
                        estimatedHours: Number.parseInt(e.target.value || '0', 10),
                      }))
                    }
                    className={inputBase}
                    placeholder="0"
                    min={0}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-white/20 dark:border-slate-700/50 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border bg-gray-100 hover:bg-gray-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={!newCourse.title.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Course
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editCourseData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <GlassCard>
              <div className="p-6 border-b border-white/20 dark:border-slate-700/50">
                <h2 className="text-xl font-semibold">Edit Course</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Title</label>
                  <input
                    type="text"
                    value={editCourseData.title}
                    onChange={(e) =>
                      setEditCourseData({ ...editCourseData, title: e.target.value })
                    }
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={editCourseData.description}
                    onChange={(e) =>
                      setEditCourseData({ ...editCourseData, description: e.target.value })
                    }
                    rows={3}
                    className={`${inputBase} resize-none`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={editCourseData.category}
                      onChange={(e) =>
                        setEditCourseData({ ...editCourseData, category: e.target.value })
                      }
                      className={inputBase}
                    >
                      {categories.slice(1).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Difficulty</label>
                    <select
                      value={editCourseData.difficulty as Difficulty}
                      onChange={(e) =>
                        setEditCourseData({
                          ...editCourseData,
                          difficulty: e.target.value as Difficulty,
                        })
                      }
                      className={inputBase}
                    >
                      {difficulties.map((diff) => (
                        <option key={diff} value={diff}>
                          {diff}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={editCourseData.estimatedHours || 0}
                    onChange={(e) =>
                      setEditCourseData({
                        ...editCourseData,
                        estimatedHours: Number.parseInt(e.target.value || '0', 10),
                      })
                    }
                    className={inputBase}
                    min={0}
                  />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Progress is calculated automatically from completed lessons.
                </div>
              </div>
              <div className="p-6 border-t border-white/20 dark:border-slate-700/50 flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border bg-gray-100 hover:bg-gray-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
