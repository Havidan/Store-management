import React from "react";
import { NavLink, Outlet, useLocation, useResolvedPath } from "react-router-dom";
import styles from "./LinksTabs.module.css";

export default function StoreOwnerLinksPage() {
  const location = useLocation();
  // basePath הוא הנתיב המלא של הראוטר הנוכחי (למשל /app/store-links)
  const basePath = useResolvedPath(".");

  const isActiveTab = (isActive, tab) => {
    // אם אנחנו בדיוק על נתיב הבסיס (לפני/אחרי ה-redirect), נחשיב את "active" כמסומן
    const atBase = location.pathname.replace(/\/+$/, "") === basePath.pathname.replace(/\/+$/, "");
    if (tab === "active" && atBase) return true;
    return isActive;
  };

  return (
    <div className={styles.page} dir="rtl">
      <h2 className={styles.title}>החיבורים שלי</h2>

      <nav className={styles.tabs} aria-label="ניווט חיבורים">
        <NavLink
          to="active"
          className={({ isActive }) =>
            `${styles.tab} ${isActiveTab(isActive, "active") ? styles.active : ""}`
          }
          end={false}
        >
          פעילים
        </NavLink>

        <NavLink
          to="pending"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ""}`
          }
        >
          ממתינים
        </NavLink>

        <NavLink
          to="discover"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ""}`
          }
        >
          מצא ספקים
        </NavLink>
      </nav>

      <div className={styles.outletWrap}>
        <Outlet />
      </div>
    </div>
  );
}
