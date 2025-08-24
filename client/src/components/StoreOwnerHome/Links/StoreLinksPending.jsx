import React, { useEffect, useState } from "react";
import axios from "axios";
import cardStyles from "./SuppliersList.module.css";

export default function StoreLinksPending() {
  const ownerId = localStorage.getItem("userId");
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // טוען בקשות ממתינות לבעל המכולת
  useEffect(() => {
    if (!ownerId) return;
    axios
      .get(`http://localhost:3000/links/owner/pending`, { params: { ownerId } })
      .then((res) => setPending(res.data || []))
      .catch((err) => console.error("Failed to fetch pending links", err));
  }, [ownerId]);

  const cancelRequest = async (supplierId) => {
    try {
      setBusyId(supplierId);
      await axios.post(`http://localhost:3000/links/cancel`, {
        ownerId,
        supplierId,
      });
      setPending((list) => list.filter((s) => s.id !== supplierId));
    } catch (e) {
      console.error("Cancel link request failed", e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={cardStyles.container}>
      <h2 className={cardStyles.title}>בקשות ממתינות</h2>

      <div className={cardStyles.grid}>
        {pending.map((supplier) => (
          <div key={supplier.id} className={cardStyles.card}>
            <h3 className={cardStyles.company}>{supplier.company_name}</h3>
            <p className={cardStyles.contactName}>{supplier.contact_name}</p>
            <p className={cardStyles.phone}>{supplier.phone}</p>

            <button
              className={cardStyles.orderButton}
              disabled={busyId === supplier.id}
              onClick={() => cancelRequest(supplier.id)}
            >
              {busyId === supplier.id ? "מבטל..." : "בטל בקשה"}
            </button>
          </div>
        ))}
        {!pending.length && (
          <div style={{ opacity: 0.8, padding: 8 }}>אין בקשות ממתינות כרגע.</div>
        )}
      </div>
    </div>
  );
}
