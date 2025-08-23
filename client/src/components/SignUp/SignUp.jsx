import React, { useEffect, useMemo, useState } from "react";
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

  // ----- תפקיד -----
  const [role, setRole] = useState("Supplier");
  const isSupplier = role === "Supplier";

  // ----- שדות משותפים -----
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ----- בעל מכולת -----
  const [ownerCityQuery, setOwnerCityQuery] = useState("");
  const [ownerCityId, setOwnerCityId] = useState(null);
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  // ----- ספק: בחירת אזורי שירות -----
  const [geoTree, setGeoTree] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState(new Set());
  const [selectedCities, setSelectedCities] = useState(new Set());

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
        out.push({
          city_id: c.city_id,
          city_name: c.city_name,
          district_id: d.district_id,
          district_name: d.district_name,
        });
      }
    }
    return out.sort((a, b) => a.city_name.localeCompare(b.city_name, "he"));
  }, [geoTree]);

  const ownerCitySuggestions = useMemo(() => {
    const q = (ownerCityQuery || "").trim();
    if (!q) return allCities.slice(0, 50);
    return allCities.filter((c) => c.city_name.includes(q)).slice(0, 50);
  }, [allCities, ownerCityQuery]);

  const chooseOwnerCityById = (id) => {
    setOwnerCityId(id);
    const found = allCities.find((c) => c.city_id === id);
    if (found) setOwnerCityQuery(found.city_name);
  };

  // ----- ספק: לוגיקת בחירה היררכית (ללא שינוי) -----
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

  // ----- שליחה (ללא שינוי לוגי) -----
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contactName.trim() || !contactPhone.trim() || !username.trim() || !password.trim()) {
      return alert("יש למלא את כל שדות החובה.");
    }

    if (isSupplier) {
      if (!companyName.trim()) return alert("לספק חובה להזין שם חברה.");
      if (selectedCities.size === 0 && selectedDistricts.size === 0) {
        return alert("סמנו לפחות עיר אחת או מחוז אחד באזורי השירות.");
      }
    } else {
      if (!ownerCityId) return alert("בחרי עיר מהרשימה (הקלידי ובחרי מהרשימה).");
      if (!street.trim()) return alert("מלאי רחוב.");
      if (!houseNumber.trim()) return alert("מלאי מספר בית.");
      if (!openingHours.trim()) return alert("מלאי שעות פתיחה.");
    }

    const payload = {
      username,
      password,
      companyName: companyName || null,
      contactName,
      phone: contactPhone,
      userType: role,
      city_id: isSupplier ? null : ownerCityId,
      street: isSupplier ? null : street,
      house_number: isSupplier ? null : houseNumber,
      opening_hours: isSupplier ? null : openingHours,
      serviceCities: isSupplier ? Array.from(selectedCities) : [],
      serviceDistricts: isSupplier ? Array.from(selectedDistricts) : [],
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
    <div className={styles.container} dir="rtl">
      <div className={styles.overlay} />
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>רישום למערכת</h2>

        {/* בורר תפקיד */}
        <div className={styles.roleSwitch}>
          <button
            type="button"
            onClick={() => setRole("Supplier")}
            className={`${styles.button} ${isSupplier ? styles.buttonActive : ""}`}
          >
            רישום כספק
          </button>
          <button
            type="button"
            onClick={() => setRole("StoreOwner")}
            className={`${styles.button} ${!isSupplier ? styles.buttonActive : ""}`}
          >
            רישום כבעל חנות
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* שם חברה */}
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

          {/* איש קשר + טלפון */}
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

          {/* טופס בעל מכולת */}
          {!isSupplier && (
            <>
              <label className={styles.label}>עיר (חובה)</label>
              <div className={styles.autocomplete}>
                <input
                  className={styles.input}
                  type="text"
                  value={ownerCityQuery}
                  onChange={(e) => {
                    setOwnerCityQuery(e.target.value);
                    setOwnerCityId(null);
                  }}
                  placeholder="הקלידי עיר ובחרי מהרשימה"
                  required
                />
                {ownerCityQuery && (
                  <div className={styles.suggestions}>
                    {ownerCitySuggestions.map((c) => (
                      <div
                        key={c.city_id}
                        onClick={() => chooseOwnerCityById(c.city_id)}
                        className={`${styles.suggestionItem} ${c.city_id === ownerCityId ? styles.suggestionActive : ""}`}
                      >
                        {c.city_name} <span className={styles.suggestionSub}>({c.district_name})</span>
                      </div>
                    ))}
                    {ownerCitySuggestions.length === 0 && (
                      <div className={styles.noResults}>אין תוצאות</div>
                    )}
                  </div>
                )}
              </div>

              <label className={styles.label}>רחוב (חובה)</label>
              <input
                className={styles.input}
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="רחוב"
                required
              />

              <label className={styles.label}>מספר בית (חובה)</label>
              <input
                className={styles.input}
                type="text"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="מספר בית"
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

          {/* טופס ספק */}
          {isSupplier && (
            <div className={styles.serviceAreasBox}>
              <div className={styles.labelStrong}>אזורי שירות (בחרו מחוזות שלמים או ערים ספציפיות):</div>
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
          )}

          {/* שם משתמש + סיסמה */}
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

          <button type="submit" className={`${styles.button} ${styles.submitBtn}`}>
            {isSupplier ? "שמור פרטי ספק" : "שמור בעל חנות"}
          </button>
        </form>
      </div>
    </div>
  );
}
