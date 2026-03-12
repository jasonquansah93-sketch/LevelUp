import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { getSupabaseClient } from '@/template';
import type { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isOnboarded: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(supabaseUser: User, meta?: { displayName?: string; isPremium?: boolean }): UserProfile {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    displayName:
      meta?.displayName ||
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split('@')[0] ||
      'User',
    isPremium: meta?.isPremium || false,
    createdAt: supabaseUser.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadUserProfile(s.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        loadUserProfile(s.user);
      } else {
        setUser(null);
        setIsOnboarded(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: User) => {
    try {
      // Ensure user_profiles row exists (trigger may not have fired yet)
      await ensureUserProfile(supabaseUser);

      // Load game meta for onboarded status and premium
      const { data: meta } = await supabase
        .from('user_game_meta')
        .select('is_onboarded, is_premium')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      setUser(mapUser(supabaseUser, {
        displayName:
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email?.split('@')[0],
        isPremium: meta?.is_premium || false,
      }));
      setIsOnboarded(meta?.is_onboarded || false);
    } catch (e) {
      console.error('loadUserProfile error:', e);
      setUser(mapUser(supabaseUser));
    } finally {
      setIsLoading(false);
    }
  };

  const ensureUserProfile = async (supabaseUser: User) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (!data) {
      await supabase.from('user_profiles').upsert({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username:
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email?.split('@')[0] ||
          'user',
      });
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signup = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw new Error(error.message);
  };

  const sendOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error(error.message);
  };

  const verifyOTP = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsOnboarded(false);
  };

  const completeOnboarding = async () => {
    if (!session?.user) return;
    await supabase.from('user_game_meta').upsert(
      { user_id: session.user.id, is_onboarded: true },
      { onConflict: 'user_id' }
    );
    setIsOnboarded(true);
  };

  const upgradeToPremium = async () => {
    if (!session?.user || !user) return;
    await supabase.from('user_game_meta').upsert(
      { user_id: session.user.id, is_premium: true },
      { onConflict: 'user_id' }
    );
    setUser({ ...user, isPremium: true });
  };

  const refreshUser = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) await loadUserProfile(u);
  };

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, isOnboarded,
      login, signup, sendOTP, verifyOTP,
      logout, completeOnboarding, upgradeToPremium, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
