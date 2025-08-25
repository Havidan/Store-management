import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../Nav/SideBar";
import styles from "./Layout.module.css";
import { useAuth } from "../../auth/AuthContext";

export default function StoreLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { USE_SESSION_AUTH, logoutSession } = useAuth();

  const ownerUsername = localStorage.getItem("username") || "ספק";

  const handleLogout = () => {
    if (USE_SESSION_AUTH) {
      logoutSession().finally(() => navigate("/"));
    } else {
      localStorage.clear();
      navigate("/");
    }
  };

  const sidebarItems = [
    { label: "הזמנות שבוצעו", to: "/StoreOwnerHome", end: true },
    { label: "טיוטת הזמנות ", to: "/ContactForm" },
    { label: "קישורים עם ספקים", to: "/StoreOwnerLinks" },
    { label: "איזור אישי", to: "/StoreOwnerSettings" },
    { label: "צור קשר", to: "/ContactForm" },
  ];

  return (
    <div className={styles.shell} dir="rtl">
      {/* Topbar קבוע */}
      <header className={styles.topbar}>
        <button className={styles.menuBtn} onClick={() => setMenuOpen(true)} aria-label="פתיחת תפריט">☰</button>
        <div className={styles.brand}>איזור ניהול בעל חנות</div>
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
