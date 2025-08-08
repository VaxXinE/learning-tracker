'use client';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Register() {
  const r = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createUserWithEmailAndPassword(auth, String(fd.get('email')), String(fd.get('password')));
    r.push('/dashboard');
  }
  return (
    <div className="container">
      <div className="card max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create account</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div><label className="label">Email</label><input className="input" name="email" type="email" required /></div>
          <div><label className="label">Password</label><input className="input" name="password" type="password" required /></div>
          <button className="btn w-full" type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}