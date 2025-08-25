import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";
import styles from "./OrderDrafts.module.css";
import { useNavigate } from "react-router-dom";

/**
 * OrderDrafts — רשימת טיוטות הזמנה בצבעי ירוק
 * הערות:
 * - מסתמך על session בצד השרת.
 * - כפתור "המשך הזמנה" מפנה ל־StoreOwnerLinks, שם בוחרים את הספק והמודל נטען עם הטיוטה.
 */
export default function OrderDrafts() {
  const [drafts, setDrafts] = useState([]);
  const { USE_SESSION_AUTH } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    try {
      if (!USE_SESSION_AUTH) return;
      const res = await api.get("/order/drafts");
      setDrafts(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const removeDraft = async (supplier_id) => {
    try {
      await api.delete(`/order/draft/${supplier_id}`);
      await load();
    } catch (e) {
      alert("מחיקת טיוטה נכשלה");
    }
  };

  return (
    <div className={styles.draftsWrap}>
      <h2 className={styles.title}>טיוטות הזמנה</h2>

      <div className={styles.card} role="region" aria-label="רשימת טיוטות">
        <div className={styles.headerRow}>
          <div>ספק</div>
          <div>מס’ פריטים</div>
          <div>עודכן</div>
          <div>פעולות</div>
        </div>

        <div className={styles.list}>
          {drafts.length === 0 ? (
            <div className={styles.empty}>אין טיוטות שמורות כרגע.</div>
          ) : (
            drafts.map((d) => (
              <div key={d.supplier_id} className={styles.row}>
                <div className={styles.cell}>
                  <span className={styles.supplierBadge}>Supplier&nbsp;#{d.supplier_id}</span>
                </div>

                <div className={styles.cell}>
                  <span className={styles.countPill}>{d.items?.length || 0}</span>
                </div>

                <div className={styles.cell}>
                  <span className={styles.timestamp}>
                    {d.updatedAt ? new Date(d.updatedAt).toLocaleString("he-IL") : "-"}
                  </span>
                </div>

                <div className={styles.cell}>
                  <div className={styles.actions}>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => navigate("/StoreOwnerLinks")}
                      title="המשך הזמנה (בחרי ספק מהרשימה, המודל ייטען עם הטיוטה)"
                    >
                      המשך הזמנה
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnGhost}`}
                      onClick={() => removeDraft(d.supplier_id)}
                    >
                      מחקי טיוטה
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
