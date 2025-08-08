'use client';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app'; // Import FirebaseError

export default function Login() {
  const r = useRouter();
  const [error, setError] = useState('');
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email'));
    const password = String(fd.get('password'));
    try {
      await signInWithEmailAndPassword(auth, email, password);
      r.push('/dashboard');
    } catch (err: unknown) { // Type the error as `unknown` first
      if (err instanceof FirebaseError) {
        setError(err.message); // Safely access the error message
      } else {
        setError('An unexpected error occurred'); // Handle non-Firebase errors
      }
    }
  }
  return (
    <div className="container">
      <div className="card max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Sign in</h1>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div><label className="label">Email</label><input className="input" name="email" type="email" required /></div>
          <div><label className="label">Password</label><input className="input" name="password" type="password" required /></div>
          <button className="btn w-full" type="submit">Sign in</button>
        </form>
        <button className="btn w-full mt-3" onClick={() => signInWithPopup(auth, googleProvider)}>Continue with Google</button>
        <p className="text-sm mt-3 text-zinc-400">No account? <Link className="underline" href="/auth/register">Register</Link></p>
      </div>
    </div>
  );
}
