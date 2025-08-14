'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  User, Mail, CalendarClock, ShieldCheck, Edit3, Loader2, Save, ImagePlus,
  ShieldAlert, LogOut, Trash2, CheckCircle2, BookOpen, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail, signOut, updateProfile, deleteUser } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';

import { CourseService, type Course } from '@/lib/firebase/courses';
import { LessonService, type Lesson } from '@/lib/firebase/lessons';
import { TaskService, type Task } from '@/lib/firebase/tasks';

/* ===== Helpers: image URL normalizer & validator ===== */
function isDirectImageURL(u: string) {
  return /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(u);
}
function normalizePhotoUrl(u?: string | null) {
  if (!u) return '';
  const trimmed = u.trim();
  if (isDirectImageURL(trimmed)) return trimmed;

  // coba ekstrak dari link google images (?imgurl= atau ?url=)
  try {
    const parsed = new URL(trimmed);
    const candidate = parsed.searchParams.get('imgurl') || parsed.searchParams.get('url');
    if (candidate && isDirectImageURL(candidate)) return candidate;
  } catch {}
  return '';
}

/* ===== Reusable glass card ===== */
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

/* ===== Avatar dengan fallback (gradient initial) ===== */
function Avatar({
  name, photoURL, size = 72,
}: { name?: string | null; photoURL?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const letter = (name || 'U').charAt(0).toUpperCase();

  if (photoURL && !failed) {
    return (
      <img
        src={photoURL}
        alt={name || 'Avatar'}
        className="rounded-full object-cover border border-white/40 dark:border-slate-700/60 shadow"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className="rounded-full grid place-items-center text-white font-semibold shadow select-none"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(168,85,247,1) 100%)',
      }}
    >
      {letter}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [err, setErr] = useState<string>('');

  // Form fields
  const [displayName, setDisplayName] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string>('');

  // Stats
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    setMsg(''); setErr('');
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      // load stats
      setLoadingStats(true);
      (async () => {
        try {
          const [c, l, t] = await Promise.all([
            CourseService.getCourses(user.uid),
            LessonService.getLessons(user.uid),
            TaskService.getTasks(user.uid),
          ]);
          setCourses(c); setLessons(l); setTasks(t);
        } finally {
          setLoadingStats(false);
        }
      })();

      const unsubC = CourseService.subscribeToCourses(user.uid, setCourses);
      const unsubL = LessonService.subscribeToLessons(user.uid, setLessons);
      const unsubT = TaskService.subscribeToTasks(user.uid, setTasks);
      return () => { unsubC(); unsubL(); unsubT(); };
    }
  }, [user]);

  const stats = useMemo(() => {
    const courseCompleted = courses.filter(c => (c.progress ?? 0) === 100).length;
    const lessonDone = lessons.filter((l: any) => l.status === 'done' || (l as any).completed).length;
    const taskDone = tasks.filter(t => t.status === 'done').length;
    return {
      courses: courses.length,
      coursesCompleted: courseCompleted,
      lessons: lessons.length,
      lessonsDone: lessonDone,
      tasks: tasks.length,
      tasksDone: taskDone,
    };
  }, [courses, lessons, tasks]);

  const previewURL = useMemo(() => {
    // preview yang aman untuk ditampilkan
    const inputNormalized = normalizePhotoUrl(photoURL);
    if (inputNormalized) return inputNormalized;
    const fromUser = normalizePhotoUrl(user?.photoURL || '');
    return fromUser || '';
  }, [photoURL, user?.photoURL]);

  const photoInputInvalid = useMemo(() => {
    // user mengisi sesuatu tapi bukan direct image
    if (!photoURL) return false;
    return !normalizePhotoUrl(photoURL);
  }, [photoURL]);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!auth.currentUser) return;
    setMsg(''); setErr(''); setSaving(true);
    try {
      const normalized = normalizePhotoUrl(photoURL) || null;
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || auth.currentUser.displayName || '',
        photoURL: normalized,
      });
      setMsg('Profile updated successfully.');
    } catch (e: unknown) {
      const fe = e as FirebaseError;
      setErr(fe?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function onResetPassword() {
    if (!user?.email) return;
    setMsg(''); setErr('');
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMsg(`Password reset email sent to ${user.email}.`);
    } catch (e: unknown) {
      const fe = e as FirebaseError;
      setErr(fe?.message || 'Failed to send reset email.');
    }
  }

  async function onSignOut() {
    await signOut(auth);
  }

  async function onDeleteAccount() {
    if (!auth.currentUser) return;
    setMsg(''); setErr('');
    try {
      await deleteUser(auth.currentUser);
      // user will be signed out automatically
    } catch (e: unknown) {
      const fe = e as FirebaseError;
      if (fe?.code === 'auth/requires-recent-login') {
        setErr('Deleting account requires recent login. Please sign in again, then retry.');
      } else {
        setErr(fe?.message || 'Failed to delete account.');
      }
    }
  }

  if (!user) {
    return (
      <div className="min-h-[100svh] grid place-items-center px-6
                      bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
                      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GlassCard>
          <div className="p-8 text-center">
            <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">You need to sign in</h2>
            <p className="text-slate-600 dark:text-slate-400">Please login to view your profile.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const created = user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
  const lastLogin = user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;

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
      <div className="mx-auto w-full max-w-screen-xl 2xl:max-w-[1280px] space-y-8">
        {/* Top: Profile header */}
        <GlassCard>
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <Avatar name={user.displayName || user.email} photoURL={previewURL} size={80} />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Learning Tracker • Stay on track
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mt-1">
                {user.displayName || 'Your Profile'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </span>
                {lastLogin && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarClock className="w-4 h-4" />
                    Last login: {lastLogin.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onSignOut}
                className="px-4 py-2 rounded-xl border bg-gray-100 hover:bg-gray-200 text-slate-800
                           dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-white
                           inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Alerts */}
        {(msg || err) && (
          <div
            className="rounded-xl border px-4 py-3 text-sm
                       bg-white/70 dark:bg-slate-800/60
                       border-white/30 dark:border-slate-700/60"
            role="status" aria-live="polite"
          >
            {msg && <div className="text-emerald-600 dark:text-emerald-400">{msg}</div>}
            {err && <div className="text-red-600 dark:text-red-400">{err}</div>}
          </div>
        )}

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Edit profile */}
          <GlassCard className="lg:col-span-2">
            <form onSubmit={onSaveProfile} className="p-6 md:p-8 space-y-5">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" /> Profile Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 md:gap-6">
                <div className="flex items-center md:items-start md:pt-1">
                  <Avatar name={displayName || user.email} photoURL={previewURL} size={72} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Display name
                    </label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 rounded-xl
                                 bg-white/70 dark:bg-slate-900/60
                                 border border-slate-200 dark:border-slate-700
                                 text-slate-900 dark:text-white placeholder-slate-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Photo URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        placeholder="https://… (direct image URL)"
                        className="flex-1 px-3 py-2 rounded-xl
                                   bg-white/70 dark:bg-slate-900/60
                                   border border-slate-200 dark:border-slate-700
                                   text-slate-900 dark:text-white placeholder-slate-400
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="inline-flex items-center justify-center px-3 rounded-xl border
                                       bg-gray-100 text-slate-700
                                       dark:bg-slate-700 dark:text-white dark:border-slate-600">
                        <ImagePlus className="w-4 h-4" />
                      </span>
                    </div>
                    {photoInputInvalid ? (
                      <p className="text-xs mt-1 text-amber-500">
                        Paste a <b>direct image link</b> (ends with .jpg/.png/.webp). Google search links won’t work.
                      </p>
                    ) : (
                      <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                        Belum ada upload? Tempel URL gambar publik (misal dari Firebase Storage).
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-semibold
                             bg-gradient-to-r from-blue-600 to-purple-600
                             hover:from-blue-500 hover:to-purple-500
                             text-white disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={onResetPassword}
                  className="px-5 py-2.5 rounded-xl border
                             bg-white/70 border-slate-200 text-slate-800 hover:bg-white
                             dark:bg-slate-900/50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-900
                             inline-flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" /> Send password reset
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Right column: Account & Stats */}
          <div className="space-y-6">
            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Account
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">UID</span>
                    <span className="font-mono text-slate-900 dark:text-white truncate max-w-[60%] text-right">{user.uid}</span>
                  </div>
                  {created && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Created</span>
                      <span className="text-slate-900 dark:text-white">{created.toLocaleString()}</span>
                    </div>
                  )}
                  {lastLogin && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Last login</span>
                      <span className="text-slate-900 dark:text-white">{lastLogin.toLocaleString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Providers</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {user.providerData.map((p, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg text-xs border
                                     bg-gray-100 text-slate-700
                                     dark:bg-slate-700/60 dark:text-slate-200 dark:border-slate-600"
                        >
                          {p.providerId.replace('.com', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> Your Stats
                </h3>

                {loadingStats ? (
                  <div className="h-24 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-700/50" />
                ) : (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/40">
                      <BookOpen className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400" />
                      <div className="mt-1 text-xl font-bold">{stats.courses}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Courses</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/40">
                      <GraduationCap className="w-5 h-5 mx-auto text-indigo-600 dark:text-indigo-400" />
                      <div className="mt-1 text-xl font-bold">{stats.lessons}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Lessons</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/40">
                      <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
                      <div className="mt-1 text-xl font-bold">{stats.tasks}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Tasks</div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Danger zone */}
            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">Danger Zone</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Deleting your account is permanent and cannot be undone.
                </p>
                <button
                  onClick={onDeleteAccount}
                  className="w-full px-4 py-2 rounded-xl border text-red-700 bg-red-50 hover:bg-red-100
                             dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30 dark:border-red-500/30
                             inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
