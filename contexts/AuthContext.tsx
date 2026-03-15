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
    console.log('[Auth] Provider mounted — checking initial session');

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log('[Auth] Initial session:', s ? `found (user: ${s.user.id})` : 'none');
      setSession(s);
      if (s?.user) {
        loadUserProfile(s.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('[Auth] State changed:', event, s ? `user: ${s.user.id}` : 'no session');
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
    console.log('[Auth] Loading profile for user:', supabaseUser.id);
    try {
      await ensureUserProfile(supabaseUser);

      const { data: meta, error: metaErr } = await supabase
        .from('user_game_meta')
        .select('is_onboarded, is_premium')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (metaErr) console.warn('[Auth] game_meta fetch error:', metaErr.message);

      const profile = mapUser(supabaseUser, {
        displayName:
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email?.split('@')[0],
        isPremium: meta?.is_premium || false,
      });

      console.log('[Auth] Profile loaded. isOnboarded:', meta?.is_onboarded || false);
      setUser(profile);
      setIsOnboarded(meta?.is_onboarded || false);
    } catch (e: any) {
      console.error('[Auth] loadUserProfile error:', e.message);
      setUser(mapUser(supabaseUser));
    } finally {
      setIsLoading(false);
      console.log('[Auth] isLoading set to false');
    }
  };

  const ensureUserProfile = async (supabaseUser: User) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (!data) {
      console.log('[Auth] Creating user_profiles row for:', supabaseUser.id);
      const { error } = await supabase.from('user_profiles').upsert({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username:
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email?.split('@')[0] ||
          'user',
      });
      if (error) console.warn('[Auth] user_profiles upsert error:', error.message);
    }
  };

  /**
   * DEV SIGNUP — uses the dev-signup Edge Function (service role) to:
   *   1. Create the user with email pre-confirmed (admin.createUser)
   *   2. Sign them in immediately and return a real session
   *   3. Set the session locally so onAuthStateChange fires
   *
   * This bypasses Supabase's email confirmation requirement entirely
   * for the development/testing phase.
   */
  const signup = async (email: string, password: string, name: string) => {
    console.log('[Auth] signup() called for:', email);

    const supabaseUrl = (supabase as any).supabaseUrl as string;
    const anonKey = (supabase as any).supabaseKey as string;
    const functionUrl = `${supabaseUrl}/functions/v1/dev-signup`;

    console.log('[Auth] Calling dev-signup edge function:', functionUrl);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ email, password, name }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('[Auth] dev-signup error:', result.error);
      throw new Error(result.error || 'Signup failed');
    }

    console.log('[Auth] dev-signup success — session received:', !!result.session);

    if (result.session) {
      // Manually set the session in the Supabase client
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      if (sessionError) {
        console.error('[Auth] setSession error:', sessionError.message);
        throw new Error(sessionError.message);
      }

      console.log('[Auth] Session set — onAuthStateChange should fire shortly');
    } else {
      console.error('[Auth] dev-signup returned no session');
      throw new Error('No session returned from signup');
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[Auth] login() called for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[Auth] login error:', error.message);
      throw new Error(error.message);
    }
    console.log('[Auth] login success — session:', !!data.session);
  };

  const sendOTP = async (email: string) => {
    console.log('[Auth] sendOTP() called for:', email);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error(error.message);
  };

  const verifyOTP = async (email: string, token: string) => {
    console.log('[Auth] verifyOTP() called for:', email);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    console.log('[Auth] logout()');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsOnboarded(false);
  };

  const completeOnboarding = async () => {
    if (!session?.user) return;
    console.log('[Auth] completeOnboarding()');
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
