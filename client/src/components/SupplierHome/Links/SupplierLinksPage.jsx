import React from "react";
import { NavLink, Outlet, useLocation, useResolvedPath } from "react-router-dom";
import styles from "./LinksTabs.module.css";

export default function SupplierLinksPage() {
  const location = useLocation();
  const basePath = useResolvedPath(".");

  const isActiveTab = (isActive, tab) => {
    const atBase = location.pathname.replace(/\/+$/, "") === basePath.pathname.replace(/\/+$/, "");
    if (tab === "active" && atBase) return true;
    return isActive;
  };

  return (
    <div className={styles.page} dir="rtl">
      <h2 className={styles.title}>חיבורים עם בעלי מכולת</h2>

      <nav className={styles.tabs} aria-label="ניווט חיבורים">
        <NavLink
          to="active"
          className={({ isActive }) =>
            `${styles.tab} ${isActiveTab(isActive, "active") ? styles.active : ""}`
          }
        >
          חיבורים פעילים
        </NavLink>

        <NavLink
          to="pending"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ""}`
          }
        >
          בקשות ממתינות
        </NavLink>
      </nav>

      <div className={styles.outletWrap}>
        <Outlet />
      </div>
    </div>
  );
}
