import React, { useEffect, useMemo, useRef, useState } from "react";
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

  // תפקיד
  const [role, setRole] = useState("Supplier");
  const isSupplier = role === "Supplier";

  // שדות משותפים
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [email, setEmail] = useState("");            // << חדש
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // בעל מכולת
  const [ownerCityQuery, setOwnerCityQuery] = useState("");
  const [ownerCityId, setOwnerCityId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");

  // ספק: אזורי שירות
  const [geoTree, setGeoTree] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState(new Set());
  const [selectedCities, setSelectedCities] = useState(new Set());

  // click-outside לאוטוקומפליט
  const comboRef = useRef(null);
  useEffect(() => {
    function onDocMouseDown(e) {
      if (!comboRef.current) return;
      if (!comboRef.current.contains(e.target)) setShowSuggestions(false);
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

  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const { data } = await axios.get("http://localhost:3000/geo/districts-with-cities");
        setGeoTree(data || []);
      } catch (e) {
        console.error("Failed to fetch geo data:", e);
        alert("שגיאה בטעינת רשימת ערים/מחוזות");
      }
    };
    fetchGeo();
  }, []);

  const allCities = useMemo(() => {
    const out = [];
    for (const d of geoTree) {
      for (const c of d.cities) {
        out.push({ city_id: c.city_id, city_name: c.city_name, district_id: d.district_id, district_name: d.district_name });
      }
    }
    return out.sort((a, b) => a.city_name.localeCompare(b.city_name, "he"));
  }, [geoTree]);

  const ownerCitySuggestions = useMemo(() => {
    const q = (ownerCityQuery || "").trim();
    if (!q) return allCities.slice(0, 50);
    return allCities.filter((c) => c.city_name.includes(q)).slice(0, 50);
  }, [allCities, ownerCityQuery]);

  const isDistrictFullySelected = (district) => {
    if (!district?.cities?.length) return selectedDistricts.has(district.district_id);
    return district.cities.every((c) => selectedCities.has(c.city_id));
  };

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

  const toggleCity = (district, city) => {
    const nextCities = new Set(selectedCities);
    if (nextCities.has(city.city_id)) nextCities.delete(city.city_id);
    else nextCities.add(city.city_id);
    const allChecked = district.cities.every((c) => nextCities.has(c.city_id));
    const nextDistricts = new Set(selectedDistricts);
    if (allChecked) nextDistricts.add(district.district_id);
    else nextDistricts.delete(district.district_id);
    setSelectedCities(nextCities);
    setSelectedDistricts(nextDistricts);
  };

  const chooseOwnerCityById = (id) => {
    setOwnerCityId(id);
    const found = allCities.find((c) => c.city_id === id);
    if (found) setOwnerCityQuery(found.city_name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRe =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (!contactName.trim() || !contactPhone.trim() || !username.trim() || !password.trim()) {
      return alert("יש למלא את כל שדות החובה.");
    }
    if (!emailRe.test(email)) {
      return alert("אימייל לא תקין");
    }

    if (isSupplier) {
      if (!companyName.trim()) return alert("לספק חובה למלא שם חברה.");
    } else {
      if (!ownerCityId) return alert("בחרי עיר מהרשימה (הקלידי ובחרי מהרשימה).");
      if (!street.trim()) return alert("מלאי רחוב.");
      if (!houseNumber.trim()) return alert("מלאי מספר בית.");
      const hhmm = /^[0-2]\d:[0-5]\d$/;
      if (!hhmm.test(openingTime)) return alert("שעת פתיחה בפורמט HH:MM");
      if (!hhmm.test(closingTime)) return alert("שעת סגירה בפורמט HH:MM");
    }

    const payload = {
      username,
      email,                       // << שולחים לשרת
      password,
      companyName: companyName || null,
      contactName,
      phone: contactPhone,
      userType: role,
      city_id: isSupplier ? null : ownerCityId,
      street: isSupplier ? null : street,
      house_number: isSupplier ? null : houseNumber,
      opening_time: isSupplier ? null : openingTime,
      closing_time: isSupplier ? null : closingTime,
      serviceCities: isSupplier ? Array.from(selectedCities) : [],
      serviceDistricts: isSupplier ? Array.from(selectedDistricts) : [],
    };

    try {
      const res = await axios.post("http://localhost:3000/user/register", payload);
      if (res.status === 201) {
        localStorage.setItem("username", username);
        localStorage.setItem("userType", role);
        localStorage.setItem("userId", res.data.userId);
        navigate(isSupplier ? "/EditProducts" : "/StoreOwnerHome");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      if (err.response?.status === 409) alert("האימייל כבר בשימוש");
      else alert(isSupplier ? "שגיאה בהוספת הספק" : "שגיאה בהוספת בעל חנות");
    }
  };

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.card}>
        <h2 className={styles.title}>הרשמה</h2>

        <div className={styles.roleSwitch}>
          <label>
            <input type="radio" checked={isSupplier} onChange={() => setRole("Supplier")} />
            ספק
          </label>
          <label>
            <input type="radio" checked={!isSupplier} onChange={() => setRole("StoreOwner")} />
            בעל מכולת
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <label className={styles.label}>שם החברה</label>
          <input className={styles.input} type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="שם חברה" />

          <label className={styles.label}>
            איש קשר <span className={styles.required}>*</span>
          </label>
          <input className={styles.input} type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="שם איש קשר" required />

          <label className={styles.label}>
            טלפון <span className={styles.required}>*</span>
          </label>
          <input className={styles.input} type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="טלפון" required />

          <label className={styles.label}>
            אימייל <span className={styles.required}>*</span>
          </label>
          <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />

          {/* בעל מכולת בלבד */}
          {!isSupplier && (
            <>
              <label className={styles.label}>
                עיר <span className={styles.required}>*</span>
              </label>
              <div className={styles.comboWrap} ref={comboRef}>
                <input
                  className={styles.input}
                  type="text"
                  value={ownerCityQuery}
                  onChange={(e) => {
                    setOwnerCityQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowSuggestions(false);
                  }}
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
                        className={`${styles.suggestionItem} ${c.city_id === ownerCityId ? styles.suggestionActive : ""}`}
                        role="option"
                        aria-selected={c.city_id === ownerCityId}
                      >
                        {c.city_name} <span className={styles.suggestionSub}>({c.district_name})</span>
                      </div>
                    ))}
                    {ownerCitySuggestions.length === 0 && <div className={styles.noResults}>אין תוצאות</div>}
                  </div>
                )}
              </div>

              <label className={styles.label}>
                רחוב <span className={styles.required}>*</span>
              </label>
              <input className={styles.input} type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="רחוב" required />

              <label className={styles.label}>
                מספר בית <span className={styles.required}>*</span>
              </label>
              <input className={styles.input} type="text" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} placeholder="מספר בית" required />

              <label className={styles.label}>
                שעת פתיחה <span className={styles.required}>*</span>
              </label>
              <input className={styles.input} type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} required />

              <label className={styles.label}>
                שעת סגירה <span className={styles.required}>*</span>
              </label>
              <input className={styles.input} type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} required />
            </>
          )}

          {/* ספק בלבד: אזורי שירות */}
          {isSupplier && (
            <div className={styles.serviceAreasBox}>
              <div className={styles.labelStrong}>אזורי שירות (בחרי מחוזות שלמים או ערים ספציפיות):</div>
              <div className={styles.serviceAreasScroll}>
                {geoTree.map((d) => {
                  const districtChecked = isDistrictFullySelected(d);
                  return (
                    <div key={d.district_id} className={styles.districtBox}>
                      <label className={styles.districtHeader}>
                        <input type="checkbox" checked={districtChecked} onChange={() => toggleDistrict(d)} />
                        <b>{d.district_name}</b>
                        <span className={styles.districtCount}>({d.cities.length} ערים)</span>
                      </label>
                      <div className={styles.citiesGrid}>
                        {d.cities.map((c) => (
                          <label key={c.city_id} className={styles.cityItem}>
                            <input type="checkbox" checked={selectedCities.has(c.city_id)} onChange={() => toggleCity(d, c)} />
                            <span>{c.city_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <label className={styles.label}>
            שם משתמש <span className={styles.required}>*</span>
          </label>
          <input className={styles.input} type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="בחרי שם משתמש" required />

          <label className={styles.label}>
            סיסמה <span className={styles.required}>*</span>
          </label>
          <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="בחרי סיסמה" required />

          <button type="submit" className={`${styles.button} ${styles.submitBtn}`}>
            {isSupplier ? "שמור פרטי ספק" : "שמור בעל חנות"}
          </button>
        </form>
      </div>
    </div>
  );
}
