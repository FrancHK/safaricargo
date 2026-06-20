import React, { createContext, useContext, useState } from 'react';
import type { AdminUser } from '../types';

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Read the persisted session synchronously so the very first render already
// knows whether the user is authenticated — otherwise a refresh briefly sees
// "logged out", bounces to /admin/login, and flashes a blank screen.
function readSavedSession(): { token: string | null; admin: AdminUser | null } {
  try {
    const savedToken = localStorage.getItem('sc_token');
    const savedAdmin = localStorage.getItem('sc_admin');
    if (savedToken && savedAdmin && savedAdmin !== 'undefined' && savedAdmin !== 'null') {
      return { token: savedToken, admin: JSON.parse(savedAdmin) as AdminUser };
    }
  } catch {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_admin');
  }
  return { token: null, admin: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ admin, token }, setSession] = useState(readSavedSession);
  const setAdmin = (a: AdminUser | null) => setSession(prev => ({ ...prev, admin: a }));
  const setToken = (t: string | null) => setSession(prev => ({ ...prev, token: t }));

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
