import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "./Settings.module.css";

// חדשים — Session toggle
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";

export default function SupplierSettingsPage() {
  const userId = localStorage.getItem("userId");

  const [saved, setSaved] = useState(false);

  // פרטי ספק
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // אזורי שירות
  const [geoTree, setGeoTree] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState(new Set());
  const [selectedCities, setSelectedCities] = useState(new Set());

  const { USE_SESSION_AUTH } = useAuth();

  // טעינה
  useEffect(() => {
    const load = async () => {
      try {
        // פרטי ספק + ערים קיימות
        let data;
        if (USE_SESSION_AUTH) {
          const res = await api.get("/settings/supplier/my");
          data = res.data;
        } else {
          const res = await axios.get("http://localhost:3000/settings/supplier", {
            params: { userId },
          });
          data = res.data;
        }

        setCompanyName(data.company_name || "");
        setContactName(data.contact_name || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        const cityIds = new Set((data.service_city_ids || []).map(Number));
        setSelectedCities(cityIds);

        // עץ מחוזות/ערים
        const geo = USE_SESSION_AUTH
          ? await api.get("/geo/districts-with-cities")
          : await axios.get("http://localhost:3000/geo/districts-with-cities");
        setGeoTree(geo.data || []);

        // סמן מחוזות "מלאים"
        const dist = new Set();
        (geo.data || []).forEach((d) => {
          const allChecked = d.cities?.length && d.cities.every((c) => cityIds.has(c.city_id));
          if (allChecked) dist.add(d.district_id);
        });
        setSelectedDistricts(dist);
      } catch (e) {
        console.error("Failed to load supplier settings:", e);
        alert("שגיאה בטעינת הנתונים");
      }
    };
    if (USE_SESSION_AUTH || userId) load();
  }, [USE_SESSION_AUTH, userId]);

  // עזר: האם מחוז מסומן במלואו
  const isDistrictFullySelected = (district) => {
    if (!district?.cities?.length) return selectedDistricts.has(district.district_id);
    return district.cities.every((c) => selectedCities.has(c.city_id));
  };

  // סימון/ביטול מחוז שלם
  const toggleDistrict = (district) => {
    const dId = district.district_id;
    const nextDistricts = new Set(selectedDistricts);
    const nextCities = new Set(selectedCities);

    const fully = isDistrictFullySelected(district);
    if (fully) {
      nextDistricts.delete(dId);
      for (const c of district.cities) nextCities.delete(c.city_id);
    } else {
      nextDistricts.add(dId);
      for (const c of district.cities) nextCities.add(c.city_id);
    }
    setSelectedDistricts(nextDistricts);
    setSelectedCities(nextCities);
  };

  // סימון/ביטול עיר אחת
  const toggleCity = (district, city) => {
    const next = new Set(selectedCities);
    if (next.has(city.city_id)) next.delete(city.city_id);
    else next.add(city.city_id);
    setSelectedCities(next);

    // עדכון מצב מחוז
    const allChecked = district.cities.every((c) => next.has(c.city_id));
    const nextDistricts = new Set(selectedDistricts);
    if (allChecked) nextDistricts.add(district.district_id);
    else nextDistricts.delete(district.district_id);
    setSelectedDistricts(nextDistricts);
  };

  const validateAndSave = async () => {
    if (!companyName.trim() || !contactName.trim() || !phone.trim()) {
      return alert("שם חברה, איש קשר וטלפון — חובה");
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailRe.test(email)) return alert("אימייל לא תקין");

    try {
      // 1) עדכון פרטים כלליים
      if (USE_SESSION_AUTH) {
        await api.put("/settings/supplier/my", {
          company_name: companyName,
          contact_name: contactName,
          phone,
          email,
        });
      } else {
        await axios.put("http://localhost:3000/settings/supplier", {
          userId,
          company_name: companyName,
          contact_name: contactName,
          phone,
          email,
        });
      }

      // 2) עדכון ערי שירות — Full Replace
      const body = { cityIds: Array.from(selectedCities).map(Number) };
      if (USE_SESSION_AUTH) {
        await api.put("/settings/supplier/service-cities/my", body);
      } else {
        await axios.put("http://localhost:3000/settings/supplier/service-cities", {
          userId,
          ...body,
        });
      }

      // הצלחה — מעבר למסך הצלחה
      setSaved(true);
    } catch (e) {
      console.error("Failed to save supplier settings:", e);
      if (e.response?.status === 409) alert("האימייל כבר בשימוש");
      else alert("שגיאה בשמירת הנתונים");
    }
  };

  return (
    <div className={styles.page} dir="rtl">
      {saved ? (
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
                ערוך שוב
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <h2 className={styles.title}>איזור אישי — ספק</h2>

          <div className={styles.formGrid}>
            <label className={styles.label}>
              שם החברה <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="שם החברה"
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
          </div>

          {/* אזורי שירות */}
          <div className={styles.serviceAreasBox}>
            <div className={styles.labelStrong}>אזורי שירות (בחר מחוזות שלמים או ערים ספציפיות):</div>
            <div className={styles.serviceAreasScroll}>
              {geoTree.map((d) => {
                const districtChecked = isDistrictFullySelected(d);
                return (
                  <div key={d.district_id} className={styles.districtBox}>
                    <label className={styles.districtHeader}>
                      <input
                        type="checkbox"
                        checked={districtChecked}
                        onChange={() => toggleDistrict(d)}
                      />
                      <b>{d.district_name}</b>
                      <span className={styles.districtCount}>({d.cities.length} ערים)</span>
                    </label>

                    <div className={styles.citiesGrid}>
                      {d.cities.map((c) => (
                        <label key={c.city_id} className={styles.cityItem}>
                          <input
                            type="checkbox"
                            checked={selectedCities.has(c.city_id)}
                            onChange={() => toggleCity(d, c)}
                          />
                          <span>{c.city_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.actions}>
            <button className={`${styles.button} ${styles.saveBtn}`} onClick={validateAndSave}>
              שמור
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
