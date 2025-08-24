import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

export default function Sidebar({ open, onClose, title = "תפריט", items = [] }) {
  return (
    <>
      {/* שכבת רקע – לוחצים כדי לסגור */}
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`}
        onClick={onClose}
      />
      {/* פאנל צף מימין (RTL) */}
      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`} dir="rtl" aria-hidden={!open}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="סגירת תפריט">×</button>
        </div>
        <nav className={styles.nav}>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end ?? false}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`
              }
              onClick={onClose}
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
