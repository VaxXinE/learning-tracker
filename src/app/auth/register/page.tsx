// src/app/auth/register/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Register() {
  const r = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // simple password strength (0-4)
  const pwScore = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  }, [password]);

  const pwLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][pwScore] || 'Very weak';
  const pwBar =
    ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][pwScore] ||
    'bg-red-500';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      r.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        relative w-screen overflow-x-hidden
        min-h-[100svh] md:min-h-dvh
        bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
        dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
      "
    >
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/10" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/10" />

      {/* full-bleed grid */}
      <div className="grid grid-cols-12 gap-0 min-h-[100svh] md:min-h-dvh">
        {/* Left info panel (desktop only) */}
        <div
          className="
            hidden lg:block lg:col-span-6
            p-10 xl:p-16
            bg-gradient-to-br from-slate-900/5 to-white/10
            dark:from-white/5 dark:to-slate-900/10
            backdrop-blur-md
          "
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-lg border border-slate-200/70 dark:border-slate-600/60 bg-white/60 dark:bg-slate-900/40">
                Next.js + Firebase
              </div>
              <h1 className="mt-4 text-[clamp(2rem,3.5vw,3rem)] font-bold text-slate-900 dark:text-white">
                Join{' '}
                <span className="bg-gradient-to-r from-blue-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Learning Tracker
                </span>
              </h1>
              <p className="mt-2 max-w-[60ch] text-slate-600 dark:text-slate-300">
                Organize courses, schedule lessons, track tasks — all in one tidy place with a clean
                glass UI and full light/dark support.
              </p>

              <ul className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• Real-time Firestore syncing</li>
                <li>• Course &amp; lesson progress</li>
                <li>• Kanban tasks + Pomodoro</li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="opacity-80">Already have an account?</span>
              <Link
                href="/auth/login"
                className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="col-span-12 lg:col-span-6 flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </Link>
            </div>

            <div className="rounded-2xl p-6 md:p-8 border border-white/30 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl shadow-xl">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Start tracking your learning in minutes.
              </p>

              {error && (
                <div className="mt-4 text-sm rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-3 py-2">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="
                        w-full pl-10 pr-3 py-3 rounded-xl text-sm
                        bg-white/70 dark:bg-slate-900/60
                        border border-slate-200 dark:border-slate-700
                        text-slate-800 dark:text-slate-100 placeholder-slate-400
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      "
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="
                        w-full pl-10 pr-10 py-3 rounded-xl text-sm
                        bg-white/70 dark:bg-slate-900/60
                        border border-slate-200 dark:border-slate-700
                        text-slate-800 dark:text-slate-100 placeholder-slate-400
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      "
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Strength meter */}
                  <div className="mt-2">
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full ${pwBar} transition-all`} style={{ width: `${(pwScore / 4) * 100}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Strength: {pwLabel}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="
                    w-full py-3 rounded-xl font-semibold
                    bg-gradient-to-r from-blue-600 to-purple-600
                    hover:from-blue-500 hover:to-purple-500
                    text-white shadow-lg shadow-blue-500/25
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                  "
                >
                  {loading ? 'Creating account…' : 'Register'}
                </button>
              </form>

              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                By continuing you agree to our <span className="underline">Terms</span> and{' '}
                <span className="underline">Privacy Policy</span>.
              </p>

              <div className="mt-6 text-sm text-slate-600 dark:text-slate-300">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 underline underline-offset-2">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* /right panel */}
      </div>
    </div>
  );
}
