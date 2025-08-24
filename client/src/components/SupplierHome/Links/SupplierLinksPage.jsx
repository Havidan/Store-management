import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function SupplierLinksPage() {
  return (
    <div style={{ padding: 16 }} dir="rtl">
      <h2>חיבורים עם בעלי מכולת</h2>

      <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
        <NavLink to="pending">בקשות ממתינות</NavLink>
        <NavLink to="active">חיבורים פעילים</NavLink>
      </div>

      <Outlet />
    </div>
  );
}
