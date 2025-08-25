import React, { useState, useEffect } from "react";
import styles from "./EditProductsList.module.css";
import AddProductModal from "../AddProductModal/AddProductModal";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// חדשים (Session Auth)
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";

function EditProductList() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);       // חדשים להוספה
  const [oldProducts, setOldProducts] = useState([]); // קיימים במערכת

  const [editingStockId, setEditingStockId] = useState(null);
  const [newStockValue, setNewStockValue] = useState("");

  const [editingProductId, setEditingProductId] = useState(null);
  const [editedProduct, setEditedProduct] = useState({
    product_name: "",
    unit_price: "",
    min_quantity: ""
  });

  const navigate = useNavigate();
  const supplierId = localStorage.getItem("userId");
  const supplierUsername = localStorage.getItem("username");

  // Session toggle
  const { USE_SESSION_AUTH } = useAuth();

  useEffect(() => {
    // טעינת מוצרים קיימים
    const load = async () => {
      try {
        if (USE_SESSION_AUTH) {
          // מצב חדש: מבוסס session (לא שולחים supplier_id מהלקוח)
          const res = await api.get("/products/my");
          setOldProducts(res.data);
        } else {
          // מצב ישן: נשארים עם ה-API הקיים
          const res = await axios.post("http://localhost:3000/products/get-products-by-supplier", {
            supplier_id: supplierId,
          });
          setOldProducts(res.data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    load();
  }, [products, supplierId, USE_SESSION_AUTH]);

  // הוספת מוצר חדש (לרשימת "להוספה")
  const handleAddProduct = async (productData) => {
    try {
      setProducts((prev) => [...prev, productData]);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // מחיקה
  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק את המוצר? פעולה זו אינה ניתנת לביטול.");
    if (!confirmDelete) return;

    try {
      let response;
      if (USE_SESSION_AUTH) {
        // נתיב חדש מבוסס session
        response = await api.delete(`/products/delete/session/${productId}`);
      } else {
        // נתיב ישן (נשאר לתאימות)
        response = await axios.delete(`http://localhost:3000/products/delete/${productId}`, {
          data: { supplier_id: supplierId }
        });
      }
      alert(response.data.message);
      setOldProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      alert(error.response?.data?.message || "שגיאה במחיקת המוצר");
    }
  };

  // עריכת מלאי
  const handleStockEdit = (productId, currentStock) => {
    setEditingStockId(productId);
    setNewStockValue(String(currentStock ?? ""));
  };

  const handleStockUpdate = async (productId) => {
    try {
      let response;
      if (USE_SESSION_AUTH) {
        // נתיב חדש מבוסס session
        response = await api.put(`/products/update-stock/session/${productId}`, {
          stock_quantity: parseInt(newStockValue)
        });
      } else {
        // נתיב ישן
        response = await axios.put(`http://localhost:3000/products/update-stock/${productId}`, {
          stock_quantity: parseInt(newStockValue)
        });
      }

      alert(response.data.message);
      setOldProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock_quantity: parseInt(newStockValue) } : p))
      );
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

  // עריכת מוצר (שם/מחיר/כמות מינ')
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
      let response;
      const payload = {
        product_name: editedProduct.product_name,
        unit_price: parseFloat(editedProduct.unit_price),
        min_quantity: parseInt(editedProduct.min_quantity)
      };

      if (USE_SESSION_AUTH) {
        // נתיב חדש מבוסס session
        response = await api.put(`/products/update/session/${productId}`, payload);
      } else {
        // נתיב ישן
        response = await axios.put(`http://localhost:3000/products/update/${productId}`, payload);
      }

      alert(response.data.message);
      setOldProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                product_name: editedProduct.product_name,
                unit_price: parseFloat(editedProduct.unit_price),
                min_quantity: parseInt(editedProduct.min_quantity)
              }
            : p
        )
      );
      setEditingProductId(null);
      setEditedProduct({ product_name: "", unit_price: "", min_quantity: "" });
    } catch (error) {
      alert(error.response?.data?.message || "שגיאה בעדכון המוצר");
    }
  };

  const cancelProductEdit = () => {
    setEditingProductId(null);
    setEditedProduct({ product_name: "", unit_price: "", min_quantity: "" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.backHomeWrapper}>
        {oldProducts.length > 0 && (
          <button className={styles.backHomeButton} onClick={() => navigate("/SupplierHome")}>
            לעמוד הבית
          </button>
        )}
      </div>

      <h2>{supplierUsername}: הוספת מוצרים עבור</h2>

      <div className={styles.toolbar}>
        <button onClick={() => setIsOpen(true)} className={styles.addButton}>
          הוספת מוצר
        </button>
      </div>

      {isOpen && (
        <AddProductModal
          onCancel={() => setIsOpen(false)}
          onAdd={handleAddProduct}
        />
      )}

      {products.length > 0 && (
        <>
          <h3>מוצרים להוספה למערכת</h3>
          <ul className={styles.grid}>
            {products.map((product, index) => (
              <li key={index} className={styles.card}>
                {product.image_url && (
                  <div
                    className={styles.cardMedia}
                    onClick={() => window.open(`http://localhost:3000${product.image_url}`, "_blank")}
                  >
                    <img
                      src={`http://localhost:3000${product.image_url}`}
                      alt={product.product_name}
                      className={styles.image}
                    />
                  </div>
                )}
                <div className={styles.cardContent}>
                  <h4 className={styles.titleLine}>{product.product_name}</h4>
                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>מחיר:</span>
                      <span className={`${styles.metaValue} ${styles.price}`}>₪{product.unit_price}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>כמות מינימלית:</span>
                      <span className={styles.metaValue}>{product.min_quantity}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>במלאי:</span>
                      <span className={styles.metaValue}>{product.stock_quantity ?? 0}</span>
                    </div>
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
      <ul className={styles.grid}>
        {oldProducts.map((product) => (
          <li key={product.id} className={styles.card}>
            {product.image_url && (
              <div
                className={styles.cardMedia}
                onClick={() => window.open(`http://localhost:3000${product.image_url}`, "_blank")}
              >
                <img
                  src={`http://localhost:3000${product.image_url}`}
                  alt={product.product_name}
                  className={styles.image}
                />
              </div>
            )}

            <div className={styles.cardContent}>
              <h4 className={styles.titleLine}>{product.product_name}</h4>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>מחיר:</span>
                  <span className={`${styles.metaValue} ${styles.price}`}>₪{product.unit_price}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>כמות מינימלית:</span>
                  <span className={styles.metaValue}>{product.min_quantity}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>מלאי:</span>
                  <span className={styles.metaValue}>{product.stock_quantity ?? 0}</span>
                </div>
              </div>

              {/* מלאי + פעולה */}
              <div className={styles.stockSection}>
                <span>כמות במלאי:</span>
                {editingStockId === product.id ? (
                  <div className={styles.editStock}>
                    <input
                      type="number"
                      value={newStockValue}
                      onChange={(e) => setNewStockValue(e.target.value)}
                      className={styles.stockInput}
                    />
                    <button onClick={() => handleStockUpdate(product.id)} className={styles.saveButton}>
                      שמור
                    </button>
                    <button onClick={cancelStockEdit} className={styles.cancelButton}>
                      ביטול
                    </button>
                  </div>
                ) : (
                  <div className={styles.editStock}>
                    <span>{product.stock_quantity ?? 0}</span>
                    <button
                      onClick={() => handleStockEdit(product.id, product.stock_quantity)}
                      className={styles.editButton}
                    >
                      ערוך מלאי
                    </button>
                  </div>
                )}
              </div>

              {/* פעולות כרטיס */}
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
          </li>
        ))}
      </ul>

      {/* Modal for editing product */}
      {editingProductId && (
        <div className={styles.editProductModalOverlay} onClick={cancelProductEdit}>
          <div className={styles.editProductModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalButton} onClick={cancelProductEdit}>×</button>
            <h3 className={styles.editProductModalTitle}>עריכת מוצר</h3>

            <div className={styles.editProductForm}>
              <div className={styles.editField}>
                <label>שם המוצר</label>
                <input
                  type="text"
                  value={editedProduct.product_name}
                  onChange={(e) => setEditedProduct({ ...editedProduct, product_name: e.target.value })}
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
                  onChange={(e) => setEditedProduct({ ...editedProduct, unit_price: e.target.value })}
                  className={styles.editInput}
                  placeholder="0.00"
                />
              </div>

              <div className={styles.editField}>
                <label>כמות מינימלית להזמנה</label>
                <input
                  type="number"
                  value={editedProduct.min_quantity}
                  onChange={(e) => setEditedProduct({ ...editedProduct, min_quantity: e.target.value })}
                  className={styles.editInput}
                  placeholder="הכנס כמות מינימלית"
                />
              </div>

              <div className={styles.editButtons}>
                <button onClick={() => handleProductUpdate(editingProductId)} className={styles.saveButton}>
                  שמור שינויים
                </button>
                <button onClick={cancelProductEdit} className={styles.cancelButton}>
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
