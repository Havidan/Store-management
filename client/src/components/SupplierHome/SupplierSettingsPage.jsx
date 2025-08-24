import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "./Settings.module.css";

export default function SupplierSettingsPage() {
  const userId = localStorage.getItem("userId");

  // מצב תצוגה: לאחר שמירה מוצלחת נסתיר את הטופס
  const [saved, setSaved] = useState(false);

  // פרטי ספק
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // אזורי שירות
  const [geoTree, setGeoTree] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState(new Set()); // לצורך UI
  const [selectedCities, setSelectedCities] = useState(new Set());       // הערים שנשמרות בפועל

  // טעינה
  useEffect(() => {
    const load = async () => {
      try {
        // פרטי ספק + אזורים שמורים
        const { data } = await axios.get("http://localhost:3000/settings/supplier", {
          params: { userId },
        });
        setCompanyName(data.company_name || "");
        setContactName(data.contact_name || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        // ערי שירות קיימות
        const cityIds = new Set((data.service_city_ids || []).map(Number));
        setSelectedCities(cityIds);

        // עץ מחוזות/ערים
        const geo = await axios.get("http://localhost:3000/geo/districts-with-cities");
        setGeoTree(geo.data || []);

        // סמן מחוזות "מלאים" לפי ערים שנבחרו
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
    if (userId) load();
  }, [userId]);

  // עזר: האם מחוז מסומן במלואו
  const isDistrictFullySelected = (district) => {
    if (!district?.cities?.length) return selectedDistricts.has(district.district_id);
    return district.cities.every((c) => selectedCities.has(c.city_id));
  };

  // סימון/ביטול מחוז שלם -> מעדכן ערים בפועל (Full Replace בגישה של המשתמש)
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
      await axios.put("http://localhost:3000/settings/supplier", {
        userId,
        company_name: companyName,
        contact_name: contactName,
        phone,
        email,
      });

      // 2) עדכון ערי שירות — Full Replace
      await axios.put("http://localhost:3000/settings/supplier/service-cities", {
        userId,
        cityIds: Array.from(selectedCities).map(Number),
      });

      // הצלחה — מעבר למסך הצלחה
      setSaved(true);
    } catch (e) {
      console.error("Failed to save supplier settings:", e);
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
                ערוך שוב
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
    </div>
  );
}
