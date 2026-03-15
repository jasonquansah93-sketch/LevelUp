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
   * DEV SIGNUP — two-path approach for frictionless dev testing:
   *
   * Path A (Primary): Calls the dev-signup Edge Function via GoTrue REST API
   *   which creates the user with email_confirm=true and returns a live session.
   *
   * Path B (Fallback): If edge function fails for any reason, uses standard
   *   supabase.auth.signUp() — which also works because the DB trigger
   *   auto_confirm_email_on_signup sets email_confirmed_at=NOW() on INSERT,
   *   then immediately signs in with signInWithPassword.
   *
   * Either path results in an immediate authenticated session with no inbox needed.
   */
  const signup = async (email: string, password: string, name: string) => {
    console.log('[Auth] signup() called for:', email);

    const supabaseUrl = (supabase as any).supabaseUrl as string;
    const anonKey = (supabase as any).supabaseKey as string;
    const functionUrl = `${supabaseUrl}/functions/v1/dev-signup`;

    // ── PATH A: Edge Function (GoTrue REST, bypasses admin IP restriction) ───
    try {
      console.log('[Auth] Trying dev-signup edge function...');
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
      console.log('[Auth] Edge function response:', response.status, result.error ?? 'ok');

      if (response.ok && result.session && !result.error) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        if (sessionError) throw new Error(sessionError.message);
        console.log('[Auth] PATH A success — session set via edge function');
        return; // ✅ done
      }

      console.warn('[Auth] Edge function did not return session, trying PATH B. Error:', result.error);
    } catch (edgeFnErr: any) {
      console.warn('[Auth] Edge function threw:', edgeFnErr.message, '— falling back to PATH B');
    }

    // ── PATH B: Fallback — standard signUp + immediate signIn ────────────────
    // The auto_confirm_email_on_signup DB trigger ensures email_confirmed_at
    // is set on INSERT, so signInWithPassword works immediately after signUp.
    console.log('[Auth] PATH B: standard signUp + signInWithPassword');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (signUpError) {
      // If user already exists, skip to sign-in
      const isExisting =
        signUpError.message.toLowerCase().includes('already') ||
        signUpError.message.toLowerCase().includes('registered');

      if (!isExisting) {
        console.error('[Auth] signUp error:', signUpError.message);
        throw new Error(signUpError.message);
      }
      console.log('[Auth] User already exists — proceeding to sign-in');
    } else {
      console.log('[Auth] signUp success, user:', signUpData.user?.id, 'session:', !!signUpData.session);
    }

    // Short wait for DB trigger to commit the auto-confirmation
    await new Promise((r) => setTimeout(r, 400));

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('[Auth] PATH B signIn error:', signInError.message);
      throw new Error(
        signInError.message.includes('Email not confirmed')
          ? 'Auto-confirmation failed. Please try again.'
          : signInError.message
      );
    }

    console.log('[Auth] PATH B success — signed in:', signInData.user?.id);
    // onAuthStateChange fires automatically; no need to call setSession
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
