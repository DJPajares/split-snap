'use client';

import type { User } from '@split-snap/shared/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.auth
        .me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => setLoading(false));
    } else {
      queueMicrotask(() => {
        setLoading(false);
      });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('auth_token', res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await api.auth.register({ email, password, name });
      localStorage.setItem('auth_token', res.token);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    // Restore guest participant identities and clear logged-in ones
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('participant_')) {
        const sessionCode = key.replace('participant_', '');
        const guestId = localStorage.getItem(
          `guest_participant_${sessionCode}`,
        );
        if (guestId) {
          localStorage.setItem(key, guestId);
          localStorage.removeItem(`guest_participant_${sessionCode}`);
        } else {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
