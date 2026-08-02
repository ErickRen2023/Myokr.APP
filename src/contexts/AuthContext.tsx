import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import {
  getToken, setToken, removeToken, getSsoProfile, setSsoProfile,
  type SsoProfile,
} from '../utils/token';

interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  ssoProfile: SsoProfile | null;
  login: (token: string, userId: number, profile?: SsoProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  userId: null,
  ssoProfile: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());
  const [userId, setUserId] = useState<number | null>(null);
  const [ssoProfileState, setSsoProfileState] = useState<SsoProfile | null>(() => getSsoProfile());

  const login = useCallback((token: string, uid: number, profile?: SsoProfile) => {
    setToken(token);
    setSsoProfile(profile);
    setSsoProfileState(profile || null);
    setUserId(uid);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setSsoProfile();
    setSsoProfileState(null);
    setUserId(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, ssoProfile: ssoProfileState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
