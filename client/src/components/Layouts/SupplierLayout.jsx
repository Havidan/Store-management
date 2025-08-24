import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../Nav/SideBar";
import styles from "./Layout.module.css";

export default function SupplierLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const supplierUsername = localStorage.getItem("username") || "ספק";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const sidebarItems = [
    { label: "הזמנות", to: "/SupplierHome", end: true },
    { label: "קישורים עם בעלי חנויות", to: "/SupplierLinks" },
    { label: "איזור אישי", to: "/SupplierSettings" },
  ];

  return (
    <div className={styles.shell} dir="rtl">
      {/* Topbar קבוע */}
      <header className={styles.topbar}>
        <button className={styles.menuBtn} onClick={() => setMenuOpen(true)} aria-label="פתיחת תפריט">☰</button>
        <div className={styles.brand}>{supplierUsername}: איזור הספק</div>
        <div className={styles.topbarActions}>
          <button className={styles.ghostBtn} onClick={() => navigate("/EditProducts")}>ניהול מוצרים</button>
          <button className={styles.ghostBtn} onClick={handleLogout}>התנתקות</button>
        </div>
      </header>

      {/* תוכן כל הדפים של Supplier */}
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
