// src/components/AuthProvider.tsx
'use client';

import {
  onAuthStateChanged,
  onIdTokenChanged,
  getIdTokenResult,
  User,
  signOut,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '@/lib/firebase';

type Role = 'superadmin' | 'admin' | 'editor' | 'user';

type Ctx = {
  user: User | null;
  loading: boolean;
  role: Role;
  isSuperAdmin: boolean;
  claims: Record<string, unknown> | null;
  /** Force-refresh id token & claims; return fresh id token (atau null kalau belum login). */
  getToken: (force?: boolean) => Promise<string | null>;
  /** Logout helper (tetap sama dengan sebelumnya). */
  logout: () => Promise<void>;
};

const defaultCtx: Ctx = {
  user: null,
  loading: true,
  role: 'user',
  isSuperAdmin: false,
  claims: null,
  getToken: async () => null,
  logout: async () => {},
};

const AuthCtx = createContext<Ctx>(defaultCtx);

function roleFromClaims(claims: any): Role {
  const r = claims?.role;
  return r === 'superadmin' || r === 'admin' || r === 'editor' ? r : 'user';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [role, setRole] = useState<Role>('user');

  async function refreshClaims(u: User | null, force = false) {
    if (!u) {
      setClaims(null);
      setRole('user');
      return null;
    }
    const res = await getIdTokenResult(u, force);
    setClaims(res.claims || null);
    setRole(roleFromClaims(res.claims));
    return res.token;
  }

  useEffect(() => {
    // 1) saat user berubah (login/logout)
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await refreshClaims(u, true); // force refresh di momen ini
      setLoading(false);
    });
    // 2) saat idToken auto-refresh di background (claims bisa berubah)
    const unsubToken = onIdTokenChanged(auth, async (u) => {
      if (u) await refreshClaims(u, false);
    });
    return () => {
      unsubAuth();
      unsubToken();
    };
  }, []);

  const getToken = async (force = false) => {
    const u = auth.currentUser;
    if (!u) return null;
    const token = await refreshClaims(u, force);
    return token ?? null;
  };

  const value = useMemo<Ctx>(
    () => ({
      user,
      loading,
      role,
      isSuperAdmin: role === 'superadmin',
      claims,
      getToken,
      logout: () => signOut(auth),
    }),
    [user, loading, role, claims],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
