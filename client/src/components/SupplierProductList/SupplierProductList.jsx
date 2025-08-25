import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./SupplierProductList.module.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";

function SupplierProductList({ supplierId: supplier_id, onClose, setRefresh }) {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [userId] = useState(localStorage.getItem("userId"));
  const navigate = useNavigate();
  const { USE_SESSION_AUTH } = useAuth();

  // שלב א: טעינת המוצרים
  useEffect(() => {
    axios
      .post("http://localhost:3000/products/get-products-by-supplier", { supplier_id })
      .then((response) => setProducts(response.data))
      .catch((error) => console.error("Error fetching products:", error));
  }, [supplier_id]);

  // שלב ב: טעינת טיוטה קיימת (אם יש) והזרמה ל-quantities
  useEffect(() => {
    if (!USE_SESSION_AUTH) return; // טיוטות יושבות על session, הגיוני רק בזרימה החדשה
    const fetchDraft = async () => {
      try {
        const res = await api.get(`/order/draft/${supplier_id}`);
        const draft = res.data;
        if (draft?.items?.length && products?.length) {
          // נבנה quantities לפי product_id -> product_name
          const idToName = Object.fromEntries(products.map(p => [p.id || p.product_id, p.product_name]));
          const q = {};
          draft.items.forEach(it => {
            const name = idToName[it.product_id];
            if (name) q[name] = Number(it.quantity) || 0;
          });
          setQuantities(q);
        }
      } catch (e) {
        // אין טיוטה/שגיאה? נתעלם בשקט
      }
    };
    fetchDraft();
  }, [USE_SESSION_AUTH, supplier_id, products]);

  const handleQuantityChange = (productName, quantity) => {
    setQuantities(prev => ({ ...prev, [productName]: quantity }));
  };

  // שמירת טיוטה לשרת
  const saveDraft = async () => {
    try {
      const items = products
        .map(p => ({
          product_id: p.id || p.product_id,
          quantity: Number(quantities[p.product_name]) || 0
        }))
        .filter(it => it.quantity > 0);

      if (USE_SESSION_AUTH) {
        await api.post("/order/draft/save", { supplier_id, items });
        alert("הטיוטה נשמרה.");
      } else {
        alert("שמירת טיוטות נתמכת רק בזרימה עם Session.");
      }
    } catch (err) {
      console.error("Failed to save draft", err);
      alert("שמירת הטיוטה נכשלה, נסי שוב.");
    }
  };

  // ניקוי טיוטה
  const clearDraft = async () => {
    try {
      if (USE_SESSION_AUTH) {
        await api.delete(`/order/draft/${supplier_id}`);
      }
      setQuantities({});
      alert("הטיוטה נמחקה.");
    } catch (err) {
      console.error("Failed to clear draft", err);
      alert("מחיקת הטיוטה נכשלה.");
    }
  };

  const makeOrder = async () => {
    const productsForOrder = products.filter(p => (quantities[p.product_name] || 0) > 0);
    if (productsForOrder.length === 0) {
      alert("לא נבחרו מוצרים. לא ניתן לבצע הזמנה ריקה.");
      return;
    }

    // בדיקות מלאי ומינימום
    for (const product of productsForOrder) {
      const quantity = Number(quantities[product.product_name]) || 0;
      if (product.stock_quantity < quantity) {
        alert(`אין מספיק מלאי עבור ${product.product_name}. במלאי: ${product.stock_quantity}, מבוקש: ${quantity}`);
        return;
      }
      if (product.stock_quantity < product.min_quantity) {
        alert(`לא ניתן להזמין ${product.product_name} - המלאי (${product.stock_quantity}) נמוך מהמינימום (${product.min_quantity})`);
        return;
      }
      if (quantity > 0 && quantity < product.min_quantity) {
        alert(`הכמות עבור ${product.product_name} חייבת להיות לפחות ${product.min_quantity} או 0`);
        return;
      }
    }

    const productsList = products.map(p => ({
      product_id: p.id || p.product_id,
      quantity: Number(quantities[p.product_name]) || 0,
    }));

    const fallbackBody = {
      supplier_id,
      owner_id: userId,
      products_list: productsList,
    };

    try {
      let response;
      if (USE_SESSION_AUTH) {
        response = await api.post("/order/add", { supplier_id, products_list: productsList });
      } else {
        response = await axios.post("http://localhost:3000/order/add", fallbackBody);
      }

      if (response.status === 201) {
        setRefresh?.(prev => !prev);
        onClose?.();
        navigate("/StoreOwnerHome");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("שגיאה בהזמנה: " + (error.response?.data?.error || error.response?.data?.message || "נסה שוב מאוחר יותר"));
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>בחר מוצרים להזמנה</h3>
        <ul className={styles.productList}>
          {products.map((product) => {
            const isOutOfStock = product.stock_quantity === 0;
            const lowStock = product.stock_quantity < product.min_quantity;

            return (
              <li key={product.product_id || product.id} className={styles.productItem}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  {product.image_url && (
                    <div className={styles.productImageContainer}>
                      <img
                        src={`http://localhost:3000${product.image_url}`}
                        alt={product.product_name}
                        className={styles.productImage}
                        onClick={() => window.open(`http://localhost:3000${product.image_url}`, "_blank")}
                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 5, cursor: "pointer", border: "1px solid #ddd" }}
                      />
                    </div>
                  )}
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>{product.product_name}</span>
                    <span className={styles.productPrice}>₪{product.unit_price}</span>
                    <span className={styles.productMin}>מינימום: {product.min_quantity}</span>
                    <span className={styles.productStock}>במלאי: {product.stock_quantity}</span>
                    {isOutOfStock && <span className={styles.outOfStock}>אזל מהמלאי</span>}
                    {lowStock && !isOutOfStock && <span className={styles.lowStock}>מלאי נמוך</span>}
                  </div>
                </div>
                <div className={styles.quantityInput}>
                  <input
                    type="number"
                    min="0"
                    value={quantities[product.product_name] || 0}
                    disabled={isOutOfStock || lowStock}
                    onChange={(e) => handleQuantityChange(product.product_name, parseInt(e.target.value) || 0)}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className={styles.modalButtons} style={{ gap: 8 }}>
          <button className={styles.placeOrderButton} onClick={makeOrder}>סגור הזמנה</button>
          <button className={styles.placeOrderButton} type="button" onClick={saveDraft}>שמור טיוטה</button>
          <button className={styles.closeButton} type="button" onClick={clearDraft}>נקה טיוטה</button>
          <button className={styles.closeButton} onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

export default SupplierProductList;
