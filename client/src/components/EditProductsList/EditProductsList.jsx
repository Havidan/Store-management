import React, { useState, useEffect } from "react";
import styles from "./EditProductsList.module.css";
import AddProductModal from "../AddProductModal/AddProductModal";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function EditProductList() {

  const [isOpen, setIsOpen] = useState(false);
  //products is a list of products to add to the memory
  const [products, setProducts] = useState([]);
  //oldProducts is a list of products in the memory.
  const [oldProducts, setOldProducts] = useState([]);
  const [editingStockId, setEditingStockId] = useState(null);
  const [newStockValue, setNewStockValue] = useState("");
  const navigate = useNavigate();
  //save the supplier id to add the product to specipfic supplier
  const supplierId = localStorage.getItem("userId");
  const supplierUsername = localStorage.getItem("username");

  useEffect(() => {
    axios
      //get the suppliers products in system
      .post("http://localhost:3000/products/get-products-by-supplier", {
        supplier_id: supplierId,
      })//when the promise resolves.
      .then((response) => {
        setOldProducts(response.data);
      })//when the promise rejected
      .catch((error) => {
        console.error("Error fetching products:", error);
      });
  }, [products, supplierId]);

  /*when adding product to memory, add it also to the list below*/
  const handleAddProduct = async (productData) => {
    try {
      const response = await axios.post("http://localhost:3000/products/add", {
        supplier_id: supplierId,
        ...productData,
      });

      setProducts([...products, productData]);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק את המוצר? פעולה זו אינה ניתנת לביטול.");
    
    if (confirmDelete) {
      try {
        const response = await axios.delete(`http://localhost:3000/products/delete/${productId}`, {
          data: { supplier_id: supplierId }
        });
        
        alert(response.data.message);
        
        // עדכון הרשימה לאחר מחיקה מוצלחת
        setOldProducts(oldProducts.filter(product => product.id !== productId));
      } catch (error) {
        alert(error.response?.data?.message || "שגיאה במחיקת המוצר");
      }
    }
  };

  const handleStockEdit = (productId, currentStock) => {
    setEditingStockId(productId);
    setNewStockValue(currentStock.toString());
  };

  const handleStockUpdate = async (productId) => {
    try {
      const response = await axios.put(`http://localhost:3000/products/update-stock/${productId}`, {
        stock_quantity: parseInt(newStockValue)
      });
      
      alert(response.data.message);
      
      // עדכון הרשימה לאחר עדכון מוצלח
      setOldProducts(oldProducts.map(product => 
        product.id === productId 
          ? { ...product, stock_quantity: parseInt(newStockValue) }
          : product
      ));
      
      setEditingStockId(null);
      setNewStockValue("");
    } catch (error) {
      alert(error.response?.data?.message || "שגיאה בעדכון המלאי");
    }
  };

  const cancelStockEdit = () => {
    setEditingStockId(null);
    setNewStockValue("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.backHomeWrapper}>
        {/*when register cannot continue without add at least 1 product*/}
        {oldProducts.length > 0 && (
          <button
            className={styles.backHomeButton}
            onClick={() => navigate("/SupplierHome")}
          >
            לעמוד הבית
          </button>
        )}
      </div>
      <h2>{supplierUsername}: הוספת מוצרים עבור</h2>

      <button onClick={() => setIsOpen(true)} className={styles.addButton}>
        הוספת מוצר
      </button>

      {isOpen && (
        <AddProductModal
          onCancel={() => setIsOpen(false)}
          onAdd={handleAddProduct}
        />
      )}

      {products.length > 0 && (
        <>
          <h3>מוצרים להוספה למערכת </h3>
          <ul className={styles.productList}>
            {products.map((product, index) => (
              <li key={index} className={styles.productItem}>
                <p>
                  מחיר: ₪{product.unit_price} | כמות מינימלית להזמנה:{" "}
                  {product.min_quantity} | כמות במלאי: {product.stock_quantity}
                </p>
                <h4>{product.product_name}</h4>
              </li>
            ))}
          </ul>
          <div className={styles.finishButtonWrapper}>
            <button
              className={styles.finishButton}
              onClick={() => {
                setProducts([]);
                navigate("/EditProducts");
              }}
            >
              סיימתי להוסיף מוצרים
            </button>
          </div>
        </>
      )}
      <h3>מוצרים שקיימים במערכת</h3>
      <ul className={styles.productList}>
        {oldProducts.map((product) => (
          <li key={product.id} className={styles.productItem}>
            <h4>{product.product_name}</h4>
            <p>
              מחיר: ₪{product.unit_price} | כמות מינימלית להזמנה:{" "}
              {product.min_quantity}
            </p>
            <div className={styles.stockSection}>
              <span>כמות במלאי: </span>
              {editingStockId === product.id ? (
                <div className={styles.editStock}>
                  <input
                    type="number"
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(e.target.value)}
                    className={styles.stockInput}
                  />
                  <button 
                    onClick={() => handleStockUpdate(product.id)}
                    className={styles.saveButton}
                  >
                    שמור
                  </button>
                  <button 
                    onClick={cancelStockEdit}
                    className={styles.cancelButton}
                  >
                    ביטול
                  </button>
                </div>
              ) : (
                <div>
                  <span>{product.stock_quantity}</span>
                  <button 
                    onClick={() => handleStockEdit(product.id, product.stock_quantity)}
                    className={styles.editButton}
                  >
                    ערוך מלאי
                  </button>
                </div>
              )}
            </div>
            <div className={styles.productActions}>
              <button 
                onClick={() => handleDeleteProduct(product.id)}
                className={styles.deleteButton}
              >
                מחק מוצר
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EditProductList;