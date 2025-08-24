import React, { useState } from "react";
import styles from "./AddProductModal.module.css";

function AddProductModal({ onCancel, onAdd }) {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // טיפול בבחירת תמונה
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    } else {
      alert("אנא בחר קובץ תמונה תקין");
      e.target.value = '';
    }
  };

  //when click to add a product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName || !price || !stock || !stockQuantity) {
      alert("Please fill in all fields");
      return;
    }

    // יצירת FormData להעלאת תמונה
    const formData = new FormData();
    formData.append('supplier_id', localStorage.getItem("userId"));
    formData.append('product_name', productName);
    formData.append('unit_price', parseFloat(price));
    formData.append('min_quantity', parseInt(stock));
    formData.append('stock_quantity', parseInt(stockQuantity));
    
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    // שליחת הנתונים כ-FormData במקום JSON
    try {
      const response = await fetch('http://localhost:3000/products/add', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        onAdd({
          product_name: productName,
          unit_price: parseFloat(price),
          min_quantity: parseInt(stock),
          stock_quantity: parseInt(stockQuantity),
          image_url: result.image_url
        });
      } else {
        const error = await response.json();
        alert("שגיאה בהוספת המוצר: " + error.message);
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

          <div className={styles.formGroup}>
            <label htmlFor="stockQuantity">כמות במלאי</label>
            <input
              name="stockQuantity"
              id="stockQuantity"
              type="number"
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
                  style={{maxWidth: '100px', maxHeight: '100px', objectFit: 'cover'}}
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