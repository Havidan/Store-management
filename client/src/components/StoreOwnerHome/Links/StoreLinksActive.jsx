import React, { useEffect, useState } from "react";
import axios from "axios";
import cardStyles from "./SuppliersList.module.css";
import SupplierProductList from "../../SupplierProductList/SupplierProductList";

// חדשים
import { useAuth } from "../../../auth/AuthContext";
import api from "../../../api/axios";

export default function StoreLinksActive() {
  const ownerId = localStorage.getItem("userId");
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { USE_SESSION_AUTH } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        if (USE_SESSION_AUTH) {
          const res = await api.get("/links/owner/active/my");
          setSuppliers(res.data || []);
        } else {
          if (!ownerId) return;
          const res = await axios.get("http://localhost:3000/links/owner/active", { params: { ownerId } });
          setSuppliers(res.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch active links", err);
      }
    })();
  }, [USE_SESSION_AUTH, ownerId]);

  const openOrderModal = (supplier) => {
    setSelectedSupplier(supplier?.id);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <div className={cardStyles.container}>
      <h2 className={cardStyles.title}>חיבורים פעילים</h2>

      <div className={cardStyles.grid}>
        {suppliers.map((supplier) => (
          <div key={supplier.id} className={cardStyles.card}>
            <h3 className={cardStyles.company}>{supplier.company_name}</h3>
            <p className={cardStyles.contactName}>{supplier.contact_name}</p>
            <p className={cardStyles.phone}>{supplier.phone}</p>

            <button
              className={cardStyles.orderButton}
              onClick={() => openOrderModal(supplier)}
            >
              לביצוע הזמנה
            </button>
          </div>
        ))}
        {!suppliers.length && (
          <div style={{ opacity: 0.8, padding: 8 }}>אין חיבורים פעילים כרגע.</div>
        )}
      </div>

      {isModalOpen && (
        <SupplierProductList
          supplierId={selectedSupplier}
          onClose={closeModal}
          setRefresh={() => {}}
        />
      )}
    </div>
  );
}
