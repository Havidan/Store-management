import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StoreOwnerPage.module.css";
import OrderListForOwner from "../OrderListForOwner/OrderListForOwner";

export default function StoreOwnerPage() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(false);

  const goToAddOrder = () => {
    navigate("/StoreOwnerLinks/discover"); // מתחילים מבחירת ספק
  };

  return (
    <div className={styles.page}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button className={styles.primaryBtn} onClick={goToAddOrder}>הוספת הזמנה חדשה</button>
        <button className={styles.ghostBtn} onClick={() => setRefresh(r => !r)}>רענון</button>
      </div>

      <OrderListForOwner refresh={refresh} />
    </div>
  );
}
