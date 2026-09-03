'use client';

import { useState, useEffect } from 'react';
import { SessionUser } from './session';
import { hasPermission, canBypassValidation, canOverrideFrozen } from './permissions';

export interface UseAuthReturn {
  user: SessionUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permCode: string) => boolean;
  canBypassValidation: boolean;
  canOverrideFrozen: boolean;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return {
    user,
    loading,
    isSuperAdmin: Boolean(user?.isSuperAdmin),
    hasPermission: (permCode: string) => hasPermission(user, permCode),
    canBypassValidation: canBypassValidation(user),
    canOverrideFrozen: canOverrideFrozen(user),
    refreshSession: fetchSession,
  };
}
