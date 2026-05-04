import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AUTH_KEY = 'factory_chat_auth';

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.isAuthenticated && parsed.user) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return { isAuthenticated: false, user: null };
}

function saveAuth(state: AuthState) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

const AuthContext = createContext<AuthContextValue | null>(null);

const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'leverstyle123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const login = (username: string, password: string): boolean => {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const newState = { isAuthenticated: true, user: username };
      setAuth(newState);
      saveAuth(newState);
      return true;
    }
    return false;
  };

  const logout = () => {
    const newState = { isAuthenticated: false, user: null };
    setAuth(newState);
    saveAuth(newState);
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
