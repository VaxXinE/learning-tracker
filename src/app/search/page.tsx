import { Suspense } from 'react';
import SearchClient from './SearchClient';

// Hindari SSG/prerender untuk route berbasis query string
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] grid place-items-center">Loading search…</div>}>
      <SearchClient />
    </Suspense>
  );
}