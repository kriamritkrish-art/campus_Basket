'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { apiRequest } from '../lib/api';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nit_token') : null;
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/api/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        if (typeof window !== 'undefined' && res.user.role) {
          localStorage.setItem('nit_role', res.user.role);
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nit_token');
          localStorage.removeItem('nit_role');
        }
        setUser(null);
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nit_token');
        localStorage.removeItem('nit_role');
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, newUser: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nit_token', token);
      if (newUser?.role) {
        localStorage.setItem('nit_role', newUser.role);
      }
    }
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignored
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nit_token');
      localStorage.removeItem('nit_role');
    }
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
