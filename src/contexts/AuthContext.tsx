import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { getToken, setToken, removeToken } from '../utils/token';

interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  login: (token: string, userId: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  userId: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());
  const [userId, setUserId] = useState<number | null>(null);

  const login = useCallback((token: string, uid: number) => {
    setToken(token);
    setUserId(uid);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUserId(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
