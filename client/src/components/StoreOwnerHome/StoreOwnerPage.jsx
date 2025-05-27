import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import styles from "./StoreOwnerPage.module.css";
import SuppliersList from "../SuppliersList/SuppliersList"; 
import OrderListForOwner from "../OrderListForOwner/OrderListForOwner";

function StoreOwnerPage() {

  const navigate = useNavigate(); 
  //send the refresh state to the orders element for updating after new order is comming
  const [refresh, setRefresh] = useState(false);
  const suppliersListRef = useRef(null);

  const handleLogout = () => {
    navigate("/");
  };

  //when clicking on add order the page will scroll to the suppliers part
  const scrollToSuppliers = () => {
    //scroll to the DOM element. behavior smooth make slow scroll.
    suppliersListRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.container}>
      <h1>איזור ניהול אישי</h1>
      <button onClick={handleLogout} className={styles.logoutButton}>
        התנתקות
      </button>
      <button onClick={scrollToSuppliers} className={styles.addOrderButton}>
        הוספת הזמנה חדשה
      </button>
      <OrderListForOwner refresh={refresh} />
      <div className={styles.container} ref={suppliersListRef}>
        <SuppliersList setRefresh={setRefresh} />
      </div>
    </div>
  );
}

export default StoreOwnerPage;
