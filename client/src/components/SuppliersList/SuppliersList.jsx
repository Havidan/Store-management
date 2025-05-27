import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./SuppliersList.module.css";
import SupplierProductList from "../SupplierProductList/SupplierProductList";

function SuppliersList({ setRefresh }) {

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  //get all the suppliers list
  useEffect(() => {
    axios
      .get("http://localhost:3000/user?userType=Supplier")
      .then((res) => setSuppliers(res.data))
      .catch((err) => console.error("Failed to fetch suppliers", err));
  }, []);

  //when choosing a supplier. display his products for order
  const openModal = (supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  //close order modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>בחר ספק להזמנה</h2>

      <div className={styles.grid}>
        {suppliers.map((supplier) => (
          
          <div
            key={supplier.id}
            className={styles.card}
            onClick={() => setSelectedSupplier(supplier.id)}
          > {/*save the supplier id for SupplierProductList component*/}
            <h3 className={styles.company}>{supplier.company_name}</h3>
            <p className={styles.contactName}>{supplier.contact_name}</p>
            <p className={styles.phone}>{supplier.phone}</p>
            <button
              className={styles.orderButton}
              onClick={() => openModal(supplier)}
            >
              לביצוע הזמנה
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <SupplierProductList
          supplierId={selectedSupplier}
          onClose={closeModal}
          setRefresh={setRefresh}
        />
      )}
    </div>
  );
}

export default SuppliersList;
