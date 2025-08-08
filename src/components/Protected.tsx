'use client';
import { useAuth } from './AuthProvider';
import Link from 'next/link';

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading...</div>;
  if (!user) return (
    <div className="container">
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Please sign in</h1>
        <p className="mb-4">You must be authenticated to access this page.</p>
        <Link className="btn" href="/auth/login">Go to Login</Link>
      </div>
    </div>
  );
  return <>{children}</>;
}