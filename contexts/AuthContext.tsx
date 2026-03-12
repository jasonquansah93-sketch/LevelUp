import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  upgradeToPremium: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: UserProfile = {
  id: 'user_001',
  email: 'alex@example.com',
  displayName: 'Alex',
  isPremium: false,
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    loadPersistedAuth();
  }, []);

  const loadPersistedAuth = async () => {
    try {
      const [savedUser, onboarded] = await Promise.all([
        AsyncStorage.getItem('levelup_user'),
        AsyncStorage.getItem('levelup_onboarded'),
      ]);
      if (savedUser) setUser(JSON.parse(savedUser));
      if (onboarded === 'true') setIsOnboarded(true);
    } catch (e) {
      console.log('Auth load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 900));
    const u = { ...MOCK_USER, email, displayName: email.split('@')[0] };
    setUser(u);
    await AsyncStorage.setItem('levelup_user', JSON.stringify(u));
  };

  const signup = async (email: string, _password: string, name: string) => {
    await new Promise((r) => setTimeout(r, 900));
    const u = { ...MOCK_USER, email, displayName: name, createdAt: new Date().toISOString() };
    setUser(u);
    await AsyncStorage.setItem('levelup_user', JSON.stringify(u));
  };

  const logout = async () => {
    setUser(null);
    setIsOnboarded(false);
    await AsyncStorage.multiRemove(['levelup_user', 'levelup_onboarded', 'levelup_game']);
  };

  const completeOnboarding = async () => {
    setIsOnboarded(true);
    await AsyncStorage.setItem('levelup_onboarded', 'true');
  };

  const upgradeToPremium = () => {
    if (!user) return;
    const u = { ...user, isPremium: true };
    setUser(u);
    AsyncStorage.setItem('levelup_user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isOnboarded, login, signup, logout, completeOnboarding, upgradeToPremium }}>
      {children}
    </AuthContext.Provider>
  );
}
