import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import styles from "./Settings.module.css";

// חדשים — Session toggle
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";

export default function StoreOwnerSettingsPage() {
  const userId = localStorage.getItem("userId");

  const [saved, setSaved] = useState(false);

  // פרטי בעל חנות
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // כתובת ושעות
  const [ownerCityQuery, setOwnerCityQuery] = useState("");
  const [ownerCityId, setOwnerCityId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");

  // עץ מחוזות/ערים
  const [geoTree, setGeoTree] = useState([]);

  // Session?
  const { USE_SESSION_AUTH } = useAuth();

  // click outside לאוטוקומפליט
  const comboRef = useRef(null);
  useEffect(() => {
    function onDocMouseDown(e) {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    function onDocKeyDown(e) {
      if (e.key === "Escape") setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, []);

  // טעינת נתוני משתמש + עץ ערים
  useEffect(() => {
    const load = async () => {
      try {
        // פרטי בעל חנות
        let data;
        if (USE_SESSION_AUTH) {
          const res = await api.get("/settings/owner/my");
          data = res.data;
        } else {
          const res = await axios.get("http://localhost:3000/settings/owner", {
            params: { userId },
          });
            data = res.data;
        }

        setCompanyName(data.company_name || "");
        setContactName(data.contact_name || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setStreet(data.street || "");
        setHouseNumber(data.house_number || "");
        setOpeningTime(data.opening_time ? String(data.opening_time).slice(0, 5) : "");
        setClosingTime(data.closing_time ? String(data.closing_time).slice(0, 5) : "");
        if (data.city_id) {
          setOwnerCityId(data.city_id);
          setOwnerCityQuery(data.city_name || "");
        }

        // עץ מחוזות/ערים
        const geo = USE_SESSION_AUTH
          ? await api.get("/geo/districts-with-cities")
          : await axios.get("http://localhost:3000/geo/districts-with-cities");
        setGeoTree(geo.data || []);
      } catch (e) {
        console.error("Failed to load owner settings:", e);
        alert("שגיאה בטעינת הנתונים");
      }
    };
    if (USE_SESSION_AUTH || userId) load();
  }, [USE_SESSION_AUTH, userId]);

  // רשימת ערים שטוחה למסנן
  const allCities = useMemo(() => {
    const out = [];
    for (const d of geoTree) {
      for (const c of d.cities) {
        out.push({
          city_id: c.city_id,
          city_name: c.city_name,
          district_name: d.district_name,
        });
      }
    }
    return out.sort((a, b) => a.city_name.localeCompare(b.city_name, "he"));
  }, [geoTree]);

  const ownerCitySuggestions = useMemo(() => {
    const q = (ownerCityQuery || "").trim();
    if (!q) return allCities.slice(0, 60);
    return allCities.filter((c) => c.city_name.includes(q)).slice(0, 60);
  }, [allCities, ownerCityQuery]);

  const chooseOwnerCityById = (id) => {
    setOwnerCityId(id);
    const found = allCities.find((c) => c.city_id === id);
    if (found) setOwnerCityQuery(found.city_name);
    setShowSuggestions(false);
  };

  const validateAndSave = async () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!contactName.trim() || !phone.trim() || !emailRe.test(email)) {
      return alert("בדקי: איש קשר, טלפון ואימייל תקין חובה");
    }
    if (!ownerCityId || !street.trim() || !houseNumber.trim()) {
      return alert("עיר, רחוב ומספר בית — חובה");
    }
    const hhmm = /^[0-2]\d:[0-5]\d$/;
    if (!hhmm.test(openingTime) || !hhmm.test(closingTime)) {
      return alert("שעות פתיחה/סגירה חייבות להיות בפורמט HH:MM");
    }

    try {
      if (USE_SESSION_AUTH) {
        await api.put("/settings/owner/my", {
          company_name: companyName || null,
          contact_name: contactName,
          phone,
          email,
          city_id: ownerCityId,
          street,
          house_number: houseNumber,
          opening_time: openingTime,
          closing_time: closingTime,
        });
      } else {
        await axios.put("http://localhost:3000/settings/owner", {
          userId,
          company_name: companyName || null,
          contact_name: contactName,
          phone,
          email,
          city_id: ownerCityId,
          street,
          house_number: houseNumber,
          opening_time: openingTime,
          closing_time: closingTime,
        });
      }
      setSaved(true);
    } catch (e) {
      console.error("Failed to save owner settings:", e);
      if (e.response?.status === 409) alert("האימייל כבר בשימוש");
      else alert("שגיאה בשמירת הנתונים");
    }
  };

  if (saved) {
    return (
      <div className={styles.page} dir="rtl">
        <div className={styles.card}>
          <div className={styles.successBox}>
            <div className={styles.successTitle}>פרטיך עודכנו בהצלחה</div>
            <div className={styles.successText}>
              אפשר לחזור ולעדכן בכל רגע דרך האזור האישי.
            </div>
            <div className={styles.successActions}>
              <button
                className={`${styles.button} ${styles.secondaryBtn}`}
                onClick={() => setSaved(false)}
              >
                ערכי שוב
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} dir="rtl">
      <div className={styles.card}>
        <h2 className={styles.title}>איזור אישי — בעל מכולת</h2>

        <div className={styles.formGrid}>
          <label className={styles.label}>
            שם העסק
          </label>
          <input
            className={styles.input}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="שם העסק (רשות)"
          />

          <label className={styles.label}>
            איש קשר <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="שם איש קשר"
          />

          <label className={styles.label}>
            טלפון <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="טלפון"
            type="tel"
          />

          <label className={styles.label}>
            אימייל <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            type="email"
          />

          <label className={styles.label}>
            עיר <span className={styles.required}>*</span>
          </label>
          <div className={styles.comboWrap} ref={comboRef}>
            <input
              className={styles.input}
              value={ownerCityQuery}
              onChange={(e) => {
                setOwnerCityQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="הקלידי שם עיר…"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
            />
            {showSuggestions && (
              <div className={styles.suggestions} role="listbox">
                {ownerCitySuggestions.map((c) => (
                  <div
                    key={c.city_id}
                    onClick={() => chooseOwnerCityById(c.city_id)}
                    className={`${styles.suggestionItem} ${
                      c.city_id === ownerCityId ? styles.suggestionActive : ""
                    }`}
                    role="option"
                    aria-selected={c.city_id === ownerCityId}
                  >
                    {c.city_name}{" "}
                    <span className={styles.suggestionSub}>({c.district_name})</span>
                  </div>
                ))}
                {ownerCitySuggestions.length === 0 && (
                  <div className={styles.noResults}>אין תוצאות</div>
                )}
              </div>
            )}
          </div>

          <label className={styles.label}>
            רחוב <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="רחוב"
          />

          <label className={styles.label}>
            מספר בית <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder="מספר בית"
          />

          <label className={styles.label}>
            שעת פתיחה <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
          />

          <label className={styles.label}>
            שעת סגירה <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button className={`${styles.button} ${styles.saveBtn}`} onClick={validateAndSave}>
            שמור
          </button>
        </div>
      </div>
    </div>
  );
}
