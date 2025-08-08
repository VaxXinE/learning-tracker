import Link from 'next/link';
export default function Home(){
  return (
    <div className="container">
      <div className="card">
        <h1 className="text-3xl font-bold">Learning Tracker</h1>
        <p className="text-zinc-400">Track courses, lessons, and progress. Built with Next.js + Firebase.</p>
        <div className="mt-4 flex gap-3">
          <Link className="btn" href="/auth/login">Sign in</Link>
          <Link className="btn" href="/auth/register">Register</Link>
          <Link className="btn" href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}