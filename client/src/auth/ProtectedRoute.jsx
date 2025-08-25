// src/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }) {
  const { USE_SESSION_AUTH, loading, user } = useAuth();
  const location = useLocation();

  // אם session כבוי – לא חוסמים כלום
  if (!USE_SESSION_AUTH) return children;

  if (loading) return <div style={{ padding: 24 }}>טוען…</div>;
  if (!user) return <Navigate to="/" replace state={{ from: location }} />;
  return children;
}

export function RoleRoute({ role, children }) {
  const { USE_SESSION_AUTH, user } = useAuth();

  if (!USE_SESSION_AUTH) return children;
  if (!user) return null;
  if (user.userType !== role) return <Navigate to="/" replace />;
  return children;
}
