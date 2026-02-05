'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import * as authService from '@/services/auth.service';

type AuthActionResult = { success: boolean; user?: User; error?: string };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthActionResult>;
  loginWithPhone: (phone: string, password: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  quickLogin: (role: UserRole) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, error: response.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.signup({ name, email, password });
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, error: response.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithPhone = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ phone, password });
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, error: response.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      return await authService.requestPasswordReset(email);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      return await authService.resetPassword(email, password);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const quickLogin = useCallback(async (role: UserRole) => {
    setIsLoading(true);
    try {
      const response = await authService.quickLogin(role === 'ops' ? 'admin' : role);
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, error: response.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasRole = useCallback((role: UserRole) => {
    return user?.role === role;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithPhone,
        logout,
        quickLogin,
        requestPasswordReset,
        resetPassword,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(requiredRole?: UserRole) {
  const { user, isLoading, isAuthenticated } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    isAuthorized: isAuthenticated && (!requiredRole || user?.role === requiredRole),
  };
}
