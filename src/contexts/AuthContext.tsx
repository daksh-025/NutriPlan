import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const profileRow = data as Profile | null;

    if (profileRow) {
      const normalizedProfile: Profile = {
        ...profileRow,
        food_allergies: profileRow.food_allergies ?? [],
        cuisine_preferences: profileRow.cuisine_preferences ?? [],
        units: (profileRow.units ?? 'metric') as 'metric' | 'imperial',
        onboarding_complete: profileRow.onboarding_complete ?? false,
        subscription_tier: (profileRow.subscription_tier ?? 'free') as Profile['subscription_tier'],
      };
      setProfile(normalizedProfile);
      return normalizedProfile;
    }

    return null;
  }

  async function ensureProfile(userRecord: User) {
    const existingProfile = await fetchProfile(userRecord.id);
    if (existingProfile) return existingProfile;

    const fallbackProfile = {
      id: userRecord.id,
      email: userRecord.email,
      full_name: userRecord.user_metadata?.full_name ?? '',
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(fallbackProfile as any)
      .select('*')
      .single();

    if (error || !data) {
      return null;
    }

    const createdRow = data as Profile;
    const createdProfile: Profile = {
      ...createdRow,
      food_allergies: createdRow.food_allergies ?? [],
      cuisine_preferences: createdRow.cuisine_preferences ?? [],
      units: (createdRow.units ?? 'metric') as 'metric' | 'imperial',
      onboarding_complete: createdRow.onboarding_complete ?? false,
      subscription_tier: (createdRow.subscription_tier ?? 'free') as Profile['subscription_tier'],
    };
    setProfile(createdProfile);
    return createdProfile;
  }

  async function refreshProfile() {
    if (user) await ensureProfile(user);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await ensureProfile(session.user);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
