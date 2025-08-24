import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function StoreOwnerLinksPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 16 }} dir="rtl">
      <h2>החיבורים שלי</h2>

      <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
        <NavLink to="active">פעילים</NavLink>
        <NavLink to="pending">ממתינים</NavLink>
        <NavLink to="discover">מצא ספקים</NavLink>
      </div>

      <Outlet />
    </div>
  );
}
