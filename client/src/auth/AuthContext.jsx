// src/auth/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../api/axios";

const USE_SESSION_AUTH = true; // אפשר להפוך ל-env בהמשך

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, userType, username }
  const [loading, setLoading] = useState(USE_SESSION_AUTH);

  // טוען את מצב המשתמש מהשרת
  const hydrate = useCallback(async () => {
    if (!USE_SESSION_AUTH) return;
    setLoading(true);
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // התחברות ב-session
  const loginSession = async (username, password) => {
    if (!USE_SESSION_AUTH) return null;
    const { data } = await api.post("/auth/login", { username, password });
    setUser(data.user);
    return data.user;
  };

  // התנתקות
  const logoutSession = async () => {
    if (!USE_SESSION_AUTH) return;
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(null);
  };

  const value = {
    user,
    loading,
    hydrate,
    loginSession,
    logoutSession,
    USE_SESSION_AUTH,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
