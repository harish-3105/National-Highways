'use client';

import { useState, useEffect } from 'react';
import { SessionUser, DEFAULT_USER } from './session';
import { hasPermission, canBypassValidation, canOverrideFrozen, canViewArchived } from './permissions';

export interface UseAuthReturn {
  user: SessionUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permCode: string) => boolean;
  canBypassValidation: boolean;
  canOverrideFrozen: boolean;
  canViewArchived: boolean;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<SessionUser | null>(DEFAULT_USER);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || DEFAULT_USER);
      } else {
        setUser(DEFAULT_USER);
      }
    } catch {
      setUser(DEFAULT_USER);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return {
    user: user || DEFAULT_USER,
    loading: false,
    isSuperAdmin: true,
    hasPermission: (permCode: string) => hasPermission(user || DEFAULT_USER, permCode),
    canBypassValidation: canBypassValidation(user || DEFAULT_USER),
    canOverrideFrozen: canOverrideFrozen(user || DEFAULT_USER),
    canViewArchived: canViewArchived(user || DEFAULT_USER),
    refreshSession: fetchSession,
  };
}
