import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshUser = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data);
    } catch (e) {
      setUser(null);
      setError(e?.response?.data?.message || e.message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setInitializing(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore logout errors; clear client state anyway
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser({ silent: true });
  }, []);

  const value = useMemo(
    () => ({ user, initializing, loading, error, refreshUser, logout }),
    [user, initializing, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
