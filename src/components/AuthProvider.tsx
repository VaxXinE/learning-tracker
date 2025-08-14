// src/components/AuthProvider.tsx
'use client';

import {
  onAuthStateChanged,
  onIdTokenChanged,
  getIdTokenResult,
  User,
  signOut,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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
  /** Logout helper. */
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

function roleFromClaims(claims: unknown): Role {
  if (claims && typeof claims === 'object') {
    const r = (claims as { role?: unknown }).role;
    if (r === 'superadmin' || r === 'admin' || r === 'editor') return r;
  }
  return 'user';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [role, setRole] = useState<Role>('user');

  const refreshClaims = useCallback(
    async (u: User | null, force = false): Promise<string | null> => {
      if (!u) {
        setClaims(null);
        setRole('user');
        return null;
      }
      const res = await getIdTokenResult(u, force);
      const c = (res.claims ?? null) as Record<string, unknown> | null;
      setClaims(c);
      setRole(roleFromClaims(c));
      return res.token ?? null;
    },
    [],
  );

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
  }, [refreshClaims]);

  const getToken = useCallback(
    async (force = false): Promise<string | null> => {
      const u = auth.currentUser;
      if (!u) return null;
      const token = await refreshClaims(u, force);
      return token ?? null;
    },
    [refreshClaims],
  );

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
    [user, loading, role, claims, getToken],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
