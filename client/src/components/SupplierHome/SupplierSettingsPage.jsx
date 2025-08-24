import React, { useState, useEffect } from "react";

export default function SupplierSettingsPage() {
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
  });

  useEffect(() => {
    // TODO: קריאה ל-API שתחזיר נתוני ספק נוכחיים
    // ואז לעשות setForm עם הנתונים האלה
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: קריאה ל-API לעדכון פרטים
    console.log("Saving supplier settings:", form);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>איזור אישי - ספק</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
        <input name="companyName" placeholder="שם החברה" value={form.companyName} onChange={handleChange}/>
        <input name="contactName" placeholder="שם איש קשר" value={form.contactName} onChange={handleChange}/>
        <input name="phone" placeholder="טלפון" value={form.phone} onChange={handleChange}/>
        <button onClick={handleSave}>שמור</button>
      </div>
    </div>
  );
}
