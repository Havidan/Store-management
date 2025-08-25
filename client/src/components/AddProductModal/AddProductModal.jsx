import React, { useState } from "react";
import styles from "./AddProductModal.module.css";

// חדשים (Session Auth)
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";

function AddProductModal({ onCancel, onAdd }) {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // האם Session פעיל? (אם כן נעדיף /products/add/session)
  const { USE_SESSION_AUTH } = useAuth();

  // טיפול בבחירת תמונה
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
    } else {
      alert("אנא בחר קובץ תמונה תקין");
      e.target.value = "";
    }
  };

  // שליחה
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName || !price || !stock || !stockQuantity) {
      alert("Please fill in all fields");
      return;
    }

    // בדיקת ערכים שליליים
    if (parseFloat(price) <= 0) {
      alert("מחיר חייב להיות גדול מאפס");
      return;
    }

    if (parseInt(stock) < 0) {
      alert("כמות מינימלית להזמנה לא יכולה להיות שלילית");
      return;
    }

    if (parseInt(stockQuantity) < 0) {
      alert("כמות במלאי לא יכולה להיות שלילית");
      return;
    }

    // נבנה FormData להעלאה (כולל תמונה אם קיימת)
    const formData = new FormData();

    // בזרימה הישנה (ללא Session) יש צורך ב-supplier_id מהלקוח
    if (!USE_SESSION_AUTH) {
      formData.append("supplier_id", localStorage.getItem("userId"));
    }

    formData.append("product_name", productName);
    formData.append("unit_price", parseFloat(price));
    formData.append("min_quantity", parseInt(stock));
    formData.append("stock_quantity", parseInt(stockQuantity));

    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      if (USE_SESSION_AUTH) {
        // זרימה חדשה: Session + קוקי HttpOnly → נתיב חדש
        const response = await api.post("/products/add/session", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // עידכון רשימה זמנית במסך העריכה (כמו שהיה עד היום)
        onAdd({
          product_name: productName,
          unit_price: parseFloat(price),
          min_quantity: parseInt(stock),
          stock_quantity: parseInt(stockQuantity),
          image_url: response.data?.image_url || null,
        });
      } else {
        // זרימה ישנה (קומפטביליות מלאה)
        const response = await fetch("http://localhost:3000/products/add", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          onAdd({
            product_name: productName,
            unit_price: parseFloat(price),
            min_quantity: parseInt(stock),
            stock_quantity: parseInt(stockQuantity),
            image_url: result.image_url || null,
          });
        } else {
          const error = await response.json();
          alert("שגיאה בהוספת המוצר: " + (error?.message || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("שגיאה בהוספת המוצר");
    }
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
              min="0.01"
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
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="לדוגמא: 50 (ביחידות)"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stockQuantity">כמות במלאי</label>
            <input
              name="stockQuantity"
              id="stockQuantity"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="לדוגמא: 200 (ביחידות)"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="productImage">תמונת המוצר</label>
            <input
              name="productImage"
              id="productImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {selectedImage && (
              <div className={styles.imagePreview}>
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="תצוגה מקדימה"
                  style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "cover" }}
                />
              </div>
            )}
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