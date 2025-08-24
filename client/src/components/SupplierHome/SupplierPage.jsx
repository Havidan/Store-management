import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SupplierHome.module.css";
import OrderListForSupplier from "../OrderListForSupplier/OrderListForSupplier";

export default function SupplierPage() {
  const navigate = useNavigate();
  const supplierId = localStorage.getItem("userId");
  const supplierUsername = localStorage.getItem("username");

  return (
    <div className={styles.page}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button className={styles.primaryBtn} onClick={() => navigate("/EditProducts")}>ניהול מוצרים</button>
      </div>

      <OrderListForSupplier supplierId={supplierId} supplierUsername={supplierUsername} />
    </div>
  );
}
