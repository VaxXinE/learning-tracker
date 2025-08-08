'use client';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

interface Ctx { user: User | null; loading: boolean; logout: () => Promise<void>; }
const AuthCtx = createContext<Ctx>({ user: null, loading: true, logout: async() => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);
  return <AuthCtx.Provider value={{ user, loading, logout: () => signOut(auth) }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);