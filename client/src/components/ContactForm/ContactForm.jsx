// src/components/ContactForm.jsx
import React, { useState } from "react";
import axios from "axios";
import styles from "../StoreOwnerHome/Settings.module.css"; // משתמש באותו עיצוב קיים

export default function ContactForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");

  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  async function onSubmit(e) {
    e.preventDefault();

    // ולידציה קצרה
    if (!fullName.trim()) return alert("שם מלא — חובה");
    if (!emailRe.test(email)) return alert("כתובת אימייל לא תקינה");
    if (!subject.trim()) return alert("נושא פנייה — חובה");
    if (!message.trim()) return alert("תוכן ההודעה — חובה");

    setSending(true);
    try {
      await axios.post("http://localhost:3000/geo/contactForm", {
        fullName,
        email,
        phone: phone || null,
        subject,
        message,
        // אופציונלי: מזהה משתמש למעקב (אם קיים בלוקאל סטוראג’)
        userId: localStorage.getItem("userId") || null,
      });
      setSent(true);
    } catch (err) {
      console.error("Contact form send failed:", err);
      alert("אירעה שגיאה בשליחת הטופס. נסי שוב.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className={styles.page} dir="rtl">
        <div className={styles.card}>
          <h2 className={styles.title}>תודה! פנייתך נשלחה</h2>
          <p>קיבלנו את ההודעה ונחזור אלייך בהקדם.</p>
          <div className={styles.actions}>
            <button
              className={`${styles.button} ${styles.saveBtn}`}
              onClick={() => {
                // איפוס לטופס חדש
                setFullName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
                setSent(false);
              }}
            >
              שלחי פנייה נוספת
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} dir="rtl">
      <div className={styles.card}>
        <h2 className={styles.title}>צור קשר</h2>

        <form onSubmit={onSubmit} className={styles.formGrid}>
          <label className={styles.label}>
            שם מלא <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="שם מלא"
            name="fullName"
            autoComplete="name"
          />

          <label className={styles.label}>
            אימייל <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            name="email"
            autoComplete="email"
          />

          <label className={styles.label}>טלפון</label>
          <input
            className={styles.input}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="טלפון (רשות)"
            name="phone"
            autoComplete="tel"
          />

          <label className={styles.label}>
            נושא פנייה <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="נושא הפנייה"
            name="subject"
          />

          <label className={styles.label}>
            תוכן ההודעה <span className={styles.required}>*</span>
          </label>
          {/* אפשר להשתמש באותו className של input לעיצוב אחיד */}
          <textarea
            className={styles.input}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="כתבי כאן את ההודעה…"
            name="message"
            rows={6}
          />

          <div />{/* מרווח בעמודת הלייבל */}
          <div className={styles.actions}>
            <button
              type="submit"
              className={`${styles.button} ${styles.saveBtn}`}
              disabled={sending}
            >
              {sending ? "שולח…" : "שלחי"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
