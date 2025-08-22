import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./SignUp.module.css";

export default function SignUp() {
  useEffect(() => {
    localStorage.removeItem("userType");
    localStorage.removeItem("username");
    localStorage.removeItem("supplierId");
    localStorage.removeItem("userId");
  }, []);

  const navigate = useNavigate();

  const [role, setRole] = useState("Supplier");
  const isSupplier = role === "Supplier";

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ולידציה מותאמת
    if (isSupplier) {
      if (!companyName.trim()) return alert("לספק חובה להזין שם חברה.");
    } else {
      if (!address.trim()) return alert("לבעל חנות חובה להזין כתובת.");
      if (!openingHours.trim()) return alert("לבעל חנות חובה להזין שעות פתיחה.");
    }
    if (!contactName.trim() || !contactPhone.trim() || !username.trim() || !password.trim()) {
      return alert("יש למלא את כל השדות החובה.");
    }

    const payload = {
      username,
      password,
      companyName: companyName || null,
      contactName,
      phone: contactPhone,
      userType: role,
      address: isSupplier ? null : address,
      opening_hours: isSupplier ? null : openingHours,
    };

    try {
      const res = await axios.post("http://localhost:3000/user/register", payload);

      if (res.status === 201) {
        localStorage.setItem("username", username);
        localStorage.setItem("userType", role);
        localStorage.setItem("userId", res.data.userId);

        if (isSupplier) {
          navigate("/EditProducts");
        } else {
          navigate("/StoreOwnerHome");
        }
      }
    } catch (err) {
      console.error("Error during registration:", err);
      alert(isSupplier ? "שגיאה בהוספת הספק" : "שגיאה בהוספת בעל חנות");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.form} style={{ gap: 0 }}>
        <h2 className={styles.title}>רישום למערכת</h2>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, direction: "rtl" }}>
          <button
            type="button"
            onClick={() => setRole("Supplier")}
            className={styles.button}
            style={{
              opacity: isSupplier ? 1 : 0.6,
              border: isSupplier ? "2px solid #333" : "1px solid transparent",
            }}
          >
            רישום כספק
          </button>
          <button
            type="button"
            onClick={() => setRole("StoreOwner")}
            className={styles.button}
            style={{
              opacity: !isSupplier ? 1 : 0.6,
              border: !isSupplier ? "2px solid #333" : "1px solid transparent",
            }}
          >
            רישום כבעל חנות
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <label className={styles.label}>
            {isSupplier ? "שם החברה (חובה)" : "שם העסק (רשות)"}
          </label>
          <input
            className={styles.input}
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={isSupplier ? "שם החברה שלך" : "שם העסק (אפשר ריק)"}
            required={isSupplier}
          />

          <label className={styles.label}>שם איש קשר (חובה)</label>
          <input
            className={styles.input}
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="שם איש קשר"
            required
          />

          <label className={styles.label}>טלפון (חובה)</label>
          <input
            className={styles.input}
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="טלפון איש קשר"
            required
          />

          {!isSupplier && (
            <>
              <label className={styles.label}>כתובת (חובה)</label>
              <input
                className={styles.input}
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="רחוב, מספר, עיר"
                required
              />

              <label className={styles.label}>שעות פתיחה (חובה)</label>
              <input
                className={styles.input}
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="למשל: א-ה 08:00-19:00; שישי 08:00-13:00"
                required
              />
            </>
          )}

          <label className={styles.label}>שם משתמש (חובה)</label>
          <input
            className={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="בחר שם משתמש"
            required
          />

          <label className={styles.label}>סיסמה (חובה)</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="בחר סיסמה"
            required
          />

          <button type="submit" className={styles.button} style={{ marginTop: 8 }}>
            {isSupplier ? "שמור פרטי ספק" : "שמור בעל חנות"}
          </button>
        </form>
      </div>
    </div>
  );
}
