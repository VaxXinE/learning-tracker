// src/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email'));
    const password = String(fd.get('password'));

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setGLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) setError(err.message);
      else setError('Google sign-in failed.');
    } finally {
      setGLoading(false);
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

      {/* full-bleed content wrapper */}
      <div className="grid grid-cols-12 gap-0 min-h-[100svh] md:min-h-dvh">
        {/* left promo panel (hidden on small screens) */}
        <div
          className="
            hidden lg:block lg:col-span-6
            p-10 xl:p-16
            bg-gradient-to-br from-slate-900/5 to-white/10
            dark:from-white/5 dark:to-slate-900/10
            backdrop-blur-md
          "
        >
          <div className="h-full flex items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full
                bg-white/70 text-slate-600 border border-white/40
                dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                Next.js + Firebase
              </span>

              <h2 className="mt-5 text-[clamp(2rem,3.5vw,3rem)] font-extrabold leading-[1.1]
                             text-slate-900 dark:text-white">
                Welcome back to your
                <span className="block bg-gradient-to-r from-blue-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Learning Tracker
                </span>
              </h2>

              <p className="mt-3 max-w-[60ch] text-slate-600 dark:text-slate-300">
                Sign in to manage courses, schedule lessons, and track tasks in one tidy dashboard that adapts to your theme.
              </p>

              <ul className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• Realtime Firestore sync</li>
                <li>• Glass UI with light/dark mode</li>
                <li>• Keyboard-friendly & responsive</li>
              </ul>
            </div>
          </div>
        </div>

        {/* right form panel */}
        <div className="col-span-12 lg:col-span-6 flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            {/* header (small) */}
            <div className="mb-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full
                bg-white/70 text-slate-600 border border-white/40
                dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 lg:hidden">
                <ShieldCheck className="w-3.5 h-3.5" />
                Next.js + Firebase
              </span>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Sign in</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Access your courses, lessons, and tasks.
              </p>
            </div>

            {/* card */}
            <div className="rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-slate-800/60
                            border border-white/30 dark:border-slate-700/60 shadow-xl">
              <div className="p-6">
                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border
                                  border-red-200/60 bg-red-50/70 px-3 py-2 text-sm text-red-700
                                  dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span className="leading-5">{error}</span>
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full rounded-xl border bg-white/70 pl-10 pr-3 py-3
                                   text-slate-900 placeholder-slate-400
                                   border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                   dark:bg-slate-900/60 dark:text-white dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full rounded-xl border bg-white/70 pl-10 pr-3 py-3
                                   text-slate-900 placeholder-slate-400
                                   border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                   dark:bg-slate-900/60 dark:text-white dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl py-3 font-semibold text-white
                               bg-gradient-to-r from-blue-600 to-purple-600
                               hover:from-blue-500 hover:to-purple-500
                               disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Sign in
                  </button>
                </form>

                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">or</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>

                <button
                  onClick={handleGoogle}
                  disabled={gLoading}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700
                             bg-white/70 dark:bg-slate-900/60 py-3 font-medium
                             hover:bg-white dark:hover:bg-slate-900
                             transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {gLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg viewBox="0 0 533.5 544.3" className="h-4 w-4" aria-hidden="true">
                      <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.2H272v95h146.9c-6.3 34-25 62.8-53.3 82v68h86.2c50.5-46.5 81.7-115.1 81.7-194.8z"/>
                      <path fill="#34a853" d="M272 544.3c72.6 0 133.6-24 178.2-65.1l-86.2-68c-24 16.1-54.7 25.6-92 25.6-70.7 0-130.6-47.7-152-111.8h-89.5v70.3C73.6 482.8 166.3 544.3 272 544.3z"/>
                      <path fill="#fbbc04" d="M120 325c-10.2-30-10.2-63.4 0-93.4V161.3H30.5C-9.9 239.8-9.9 338.5 30.5 417l89.5-70.3z"/>
                      <path fill="#ea4335" d="M272 107.7c39.6-.6 77.8 14 106.9 41.2l80.1-80.1C411 24.7 349.9 0 272 0 166.3 0 73.6 61.5 30.5 161.3L120 231.6C141.4 167.5 201.3 119.7 272 119.7z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>

                <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                  No account?{' '}
                  <Link href="/auth/register" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    Register
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* /right panel */}
      </div>
    </div>
  );
}
