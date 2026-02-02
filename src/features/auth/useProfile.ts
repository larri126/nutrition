'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type ProfileRole = 'client' | 'coach' | 'admin';

export type Profile = {
  id: string;
  email: string | null;
  role: ProfileRole;
  display_name: string | null;
  created_at?: string;
  updated_at?: string;
};

export function useProfile() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,role,display_name,created_at,updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile', error);
      setProfile(null);
    } else {
      setProfile(data as Profile | null);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      await loadProfile();
    };

    run();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      if (!isActive) return;
      loadProfile();
    });

    return () => {
      isActive = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [loadProfile, supabase]);

  return { profile, userId, loading, refresh: loadProfile };
}
