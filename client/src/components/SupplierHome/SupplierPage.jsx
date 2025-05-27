import React, { useEffect, useState } from "react";
import OrderListForSupplier from "../OrderListForSupplier/OrderListForSupplier";
import styles from "./SupplierHome.module.css";
import { useNavigate } from "react-router-dom"; 

function SupplierPage() {

  const navigate = useNavigate(); 

  //for save the datails after rendering
  const supplierId = localStorage.getItem("userId");
  const supplierUsername = localStorage.getItem("username");

  const handleLogout = () => {
    //come back to login form
    navigate("/");
  };

  //if the supplier is registered he can continue to add available products
  const handleEditProducts = () => {
    navigate("/EditProducts"); 
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {supplierUsername}: ברוכים הבאים לאיזור האישי של
      </h2>
      <button onClick={handleLogout} className={styles.logoutButton}>
        התנתקות
      </button>

      <button
        onClick={handleEditProducts}
        className={styles.editProductsButton}
      >
        להוספת מוצרים זמינים
      </button>

      <OrderListForSupplier
        supplierId={supplierId}
        supplierUsername={supplierUsername}
      />
    </div>
  );
}

export default SupplierPage;
