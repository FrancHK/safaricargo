import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AdminUser } from '../types';

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('sc_token');
    const savedAdmin = localStorage.getItem('sc_admin');
    if (savedToken && savedAdmin && savedAdmin !== 'undefined' && savedAdmin !== 'null') {
      try {
        setToken(savedToken);
        setAdmin(JSON.parse(savedAdmin));
      } catch {
        localStorage.removeItem('sc_token');
        localStorage.removeItem('sc_admin');
      }
    }
  }, []);

  function login(newToken: string, newAdmin: AdminUser) {
    setToken(newToken);
    setAdmin(newAdmin);
    localStorage.setItem('sc_token', newToken);
    localStorage.setItem('sc_admin', JSON.stringify(newAdmin));
  }

  function logout() {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_admin');
  }

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
