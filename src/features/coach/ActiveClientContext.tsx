'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Profile } from '@/features/auth/useProfile';

const STORAGE_KEY = 'active_client_id';

type ActiveClientContextValue = {
  activeClientId: string | null;
  setActiveClientId: (id: string | null) => void;
};

const ActiveClientContext = createContext<ActiveClientContextValue | undefined>(undefined);

export function ActiveClientProvider({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const [activeClientId, setActiveClientIdState] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setActiveClientIdState(null);
      return;
    }

    if (profile.role === 'client') {
      setActiveClientIdState(profile.id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, profile.id);
      }
      return;
    }

    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setActiveClientIdState(stored ?? null);
  }, [profile]);

  const setActiveClientId = (id: string | null) => {
    setActiveClientIdState(id);
    if (typeof window === 'undefined') return;
    if (id) {
      window.localStorage.setItem(STORAGE_KEY, id);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo(
    () => ({
      activeClientId,
      setActiveClientId,
    }),
    [activeClientId]
  );

  return <ActiveClientContext.Provider value={value}>{children}</ActiveClientContext.Provider>;
}

export function useActiveClient() {
  const context = useContext(ActiveClientContext);
  if (!context) {
    throw new Error('useActiveClient must be used within ActiveClientProvider');
  }
  return context;
}
