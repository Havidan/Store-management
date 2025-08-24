import React, { useState, useEffect } from "react";

export default function StoreOwnerSettingsPage() {
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    city: "",
    street: "",
    houseNumber: "",
    openingHours: "",
  });

  useEffect(() => {
    // TODO: קריאה ל-API שתחזיר את הנתונים הנוכחיים של המשתמש
    // ואז לעשות setForm עם הנתונים האלה
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: קריאה ל-API לעדכון פרטים
    console.log("Saving settings:", form);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>איזור אישי - בעל מכולת</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
        <input name="companyName" placeholder="שם העסק" value={form.companyName} onChange={handleChange}/>
        <input name="contactName" placeholder="שם איש קשר" value={form.contactName} onChange={handleChange}/>
        <input name="phone" placeholder="טלפון" value={form.phone} onChange={handleChange}/>
        <input name="city" placeholder="עיר" value={form.city} onChange={handleChange}/>
        <input name="street" placeholder="רחוב" value={form.street} onChange={handleChange}/>
        <input name="houseNumber" placeholder="מספר בית" value={form.houseNumber} onChange={handleChange}/>
        <input name="openingHours" placeholder="שעות פתיחה" value={form.openingHours} onChange={handleChange}/>
        <button onClick={handleSave}>שמור</button>
      </div>
    </div>
  );
}
