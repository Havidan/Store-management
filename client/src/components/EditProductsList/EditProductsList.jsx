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
  
  // מצבים לעריכת מוצר
  const [editingProductId, setEditingProductId] = useState(null);
  const [editedProduct, setEditedProduct] = useState({
    product_name: "",
    unit_price: "",
    min_quantity: ""
  });
  
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

  // פונקציות עריכת מוצר
  const handleProductEdit = (product) => {
    setEditingProductId(product.id);
    setEditedProduct({
      product_name: product.product_name,
      unit_price: product.unit_price,
      min_quantity: product.min_quantity
    });
  };

  const handleProductUpdate = async (productId) => {
    try {
      const response = await axios.put(`http://localhost:3000/products/update/${productId}`, {
        product_name: editedProduct.product_name,
        unit_price: parseFloat(editedProduct.unit_price),
        min_quantity: parseInt(editedProduct.min_quantity)
      });
      
      alert(response.data.message);
      
      // עדכון הרשימה לאחר עדכון מוצלח
      setOldProducts(oldProducts.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              product_name: editedProduct.product_name,
              unit_price: parseFloat(editedProduct.unit_price),
              min_quantity: parseInt(editedProduct.min_quantity)
            }
          : product
      ));
      
      setEditingProductId(null);
      setEditedProduct({
        product_name: "",
        unit_price: "",
        min_quantity: ""
      });
    } catch (error) {
      alert(error.response?.data?.message || "שגיאה בעדכון המוצר");
    }
  };

  const cancelProductEdit = () => {
    setEditingProductId(null);
    setEditedProduct({
      product_name: "",
      unit_price: "",
      min_quantity: ""
    });
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
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  {product.image_url && (
                    <div className={styles.productImageContainer}>
                      <img 
                        src={`http://localhost:3000${product.image_url}`}
                        alt={product.product_name}
                        className={styles.productImage}
                        onClick={() => window.open(`http://localhost:3000${product.image_url}`, '_blank')}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>
                  )}
                  <div className={styles.productDetails}>
                    <h4>{product.product_name}</h4>
                    <p>
                      מחיר: ₪{product.unit_price} | כמות מינימלית להזמנה:{" "}
                      {product.min_quantity} | כמות במלאי: {product.stock_quantity}
                    </p>
                  </div>
                </div>
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
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              {product.image_url && (
                <div className={styles.productImageContainer}>
                  <img 
                    src={`http://localhost:3000${product.image_url}`}
                    alt={product.product_name}
                    className={styles.productImage}
                    onClick={() => window.open(`http://localhost:3000${product.image_url}`, '_blank')}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              )}
              <div className={styles.productDetails}>
                {/* מצב תצוגה רגיל */}
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
                    onClick={() => handleProductEdit(product)}
                    className={styles.editProductButton}
                  >
                    ערוך מוצר
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className={styles.deleteButton}
                  >
                    מחק מוצר
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal for editing product */}
      {editingProductId && (
        <div className={styles.editProductModalOverlay} onClick={cancelProductEdit}>
          <div className={styles.editProductModal} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.closeModalButton}
              onClick={cancelProductEdit}
            >
              ×
            </button>
            
            <h3 className={styles.editProductModalTitle}>עריכת מוצר</h3>
            
            <div className={styles.editProductForm}>
              <div className={styles.editField}>
                <label>שם המוצר</label>
                <input
                  type="text"
                  value={editedProduct.product_name}
                  onChange={(e) => setEditedProduct({
                    ...editedProduct,
                    product_name: e.target.value
                  })}
                  className={styles.editInput}
                  placeholder="הכנס שם מוצר"
                />
              </div>
              
              <div className={styles.editField}>
                <label>מחיר ליחידה (₪)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editedProduct.unit_price}
                  onChange={(e) => setEditedProduct({
                    ...editedProduct,
                    unit_price: e.target.value
                  })}
                  className={styles.editInput}
                  placeholder="0.00"
                />
              </div>
              
              <div className={styles.editField}>
                <label>כמות מינימלית להזמנה</label>
                <input
                  type="number"
                  value={editedProduct.min_quantity}
                  onChange={(e) => setEditedProduct({
                    ...editedProduct,
                    min_quantity: e.target.value
                  })}
                  className={styles.editInput}
                  placeholder="הכנס כמות מינימלית"
                />
              </div>
              
              <div className={styles.editButtons}>
                <button 
                  onClick={() => handleProductUpdate(editingProductId)}
                  className={styles.saveButton}
                >
                  שמור שינויים
                </button>
                <button 
                  onClick={cancelProductEdit}
                  className={styles.cancelButton}
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProductList;