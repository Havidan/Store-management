import React, { useState } from "react";
import styles from "./AddProductModal.module.css";

function AddProductModal({ onCancel, onAdd }) {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  //when click to add a product
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!productName || !price || !stock) {
      alert("Please fill in all fields");
      return;
    }

    //product details
    const productData = {
      product_name: productName,
      unit_price: parseFloat(price),
      min_quantity: parseInt(stock),
    };

    onAdd(productData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>הוסף מוצר זמין</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="productName">שם המוצר</label>
            <input
              name="productName"
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="לדוגמא: גבינה לבנה 5% 500 גרם"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="price">מחיר</label>
            <input
              name="price"
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="לדוגמא: 5.9 (המחיר בשקלים)"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stock">כמות מינימלית להזמנה</label>
            <input
              name="stock"
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="לדוגמא: 50 (ביחידות)"
              required
            />
          </div>

          <div className={styles.modalButtons}>
            <button
              type="button"
              onClick={() => onCancel(false)}
              className={styles.cancelButton}
            >
              ביטול
            </button>
            <button type="submit" className={styles.addButton}>
              לחץ להוספת מוצר
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;
