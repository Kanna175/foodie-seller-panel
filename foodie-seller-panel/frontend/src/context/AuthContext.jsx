import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearSession, getSession, isMockMode, saveSession, setMockMode } from '../api/client';
import { DEMO_LOGIN } from '../api/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  // A 401 from the gateway (expired / revoked token) logs the seller out everywhere.
  useEffect(() => {
    const onUnauthorized = () => setSession(null);
    window.addEventListener('foodie:unauthorized', onUnauthorized);
    return () => window.removeEventListener('foodie:unauthorized', onUnauthorized);
  }, []);

  const start = useCallback((data) => {
    const next = { ...data, mock: isMockMode() };
    saveSession(next);
    setSession(next);
  }, []);

  const login = useCallback(async (identifier, password) => start(await api.login(identifier, password)), [start]);
  const demoLogin = useCallback(() => login(DEMO_LOGIN.identifier, DEMO_LOGIN.password), [login]);
  const register = useCallback(async (payload) => start(await api.register(payload)), [start]);

  const logout = useCallback(async () => {
    try {
      await api.logout(); // revokes the JWT on the gateway
    } catch { /* still log out locally */ }
    setMockMode(false);
    clearSession();
    setSession(null);
  }, []);

  /** Merge fields (e.g. online, restaurantName) into the stored session. */
  const patchSession = useCallback((partial) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      saveSession(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ session, login, demoLogin, register, logout, patchSession }),
    [session, login, demoLogin, register, logout, patchSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
