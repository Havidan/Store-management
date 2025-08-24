import React, { useEffect, useState } from "react";
import axios from "axios";
import cardStyles from "./SuppliersList.module.css";

export default function StoreLinksDiscover() {
  const ownerId = localStorage.getItem("userId");
  const [suppliers, setSuppliers] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [sentIds, setSentIds] = useState(new Set());

  // טוען ספקים זמינים לבעל המכולת (מסוננים לפי עיר/מחוז בצד השרת)
  useEffect(() => {
    if (!ownerId) return;
    axios
      .get(`http://localhost:3000/links/owner/discover`, { params: { ownerId } })
      .then((res) => setSuppliers(res.data || []))
      .catch((err) => console.error("Failed to fetch discover suppliers", err));
  }, [ownerId]);

  const sendLinkRequest = async (supplierId) => {
    try {
      setBusyId(supplierId);
      await axios.post(`http://localhost:3000/links/request`, {
        ownerId,
        supplierId,
      });
      setSentIds((prev) => new Set(prev).add(supplierId));
    } catch (e) {
      console.error("Send link request failed", e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={cardStyles.container}>
      <h2 className={cardStyles.title}>מצא ספקים חדשים בעיר שלך</h2>

      <div className={cardStyles.grid}>
        {suppliers.map((supplier) => {
          const sent = sentIds.has(supplier.id) || supplier.request_sent;
          return (
            <div key={supplier.id} className={cardStyles.card}>
              <h3 className={cardStyles.company}>{supplier.company_name}</h3>
              <p className={cardStyles.contactName}>{supplier.contact_name}</p>
              <p className={cardStyles.phone}>{supplier.phone}</p>

              <button
                className={cardStyles.orderButton}
                disabled={sent || busyId === supplier.id}
                onClick={() => sendLinkRequest(supplier.id)}
              >
                {busyId === supplier.id
                  ? "שולח..."
                  : sent
                  ? "בקשה נשלחה"
                  : "שלח בקשת חיבור"}
              </button>
            </div>
          );
        })}
        {!suppliers.length && (
          <div style={{ opacity: 0.8, padding: 8 }}>
            לא נמצאו ספקים זמינים חדשים בעיר שלך.
          </div>
        )}
      </div>
    </div>
  );
}
