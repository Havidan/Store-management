import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../Nav/SideBar";
import styles from "./Layout.module.css";

export default function StoreLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const sidebarItems = [
    { label: "הזמנות", to: "/StoreOwnerHome", end: true },
    { label: "קישורים עם ספקים", to: "/StoreOwnerLinks" },
    { label: "איזור אישי", to: "/StoreOwnerSettings" },
  ];

  return (
    <div className={styles.shell} dir="rtl">
      {/* Topbar קבוע */}
      <header className={styles.topbar}>
        <button className={styles.menuBtn} onClick={() => setMenuOpen(true)} aria-label="פתיחת תפריט">☰</button>
        <div className={styles.brand}>איזור בעל מכולת</div>
        <div className={styles.topbarActions}>
          <button className={styles.ghostBtn} onClick={handleLogout}>התנתקות</button>
        </div>
      </header>

      {/* תוכן כל הדפים של StoreOwner */}
      <main className={styles.main}>
        <div className={styles.contentWide}>
          <div className={styles.tableWrap}>
            <Outlet />
          </div>
        </div>
      </main>

      {/* Sidebar צף */}
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={sidebarItems}
      />
    </div>
  );
}
