import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./SupplierProductList.module.css";

function SupplierProductList({ supplierId: supplier_id, onClose, setRefresh }) {
  const [products, setProducts] = useState([]);
  //quantities is object of pairs productName : amount
  const [quantities, setQuantities] = useState({});
  const [userId, setUserId] = useState(localStorage.getItem("userId"));

  useEffect(() => {
    //get the products of specific supplier
    axios
      .post("http://localhost:3000/products/get-products-by-supplier", {
        supplier_id: supplier_id,
      })
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
      });
  }, [supplier_id]);

  
  const handleQuantityChange = (productName, quantity) => {
    //an object of product name and quantity pairs
    setQuantities({
      ...quantities,
      [productName]: quantity,
    });
  };

  const makeOrder = async () => {
    //avoid empty orders
    //add this code at 21.04
    const productsForOrder = products.filter((product) => quantities[product.product_name] > 0)
    if (productsForOrder.length==0){
      alert("לא נבחרו מוצרים. לא ניתן לבצע הזמנה ריקה.")
      return;
    }

    // בדיקת מלאי ומינימום לכל מוצר
    for (const product of productsForOrder) {
      const quantity = quantities[product.product_name];
      
      // בדיקה אם יש מספיק במלאי
      if (product.stock_quantity < quantity) {
        alert(`אין מספיק מלאי עבור ${product.product_name}. במלאי: ${product.stock_quantity}, מבוקש: ${quantity}`);
        return;
      }

      // בדיקה אם המלאי נמוך מהמינימום להזמנה
      if (product.stock_quantity < product.min_quantity) {
        alert(`לא ניתן להזמין ${product.product_name} - המלאי (${product.stock_quantity}) נמוך מהכמות המינימלית להזמנה (${product.min_quantity})`);
        return;
      }

      // בדיקה אם הכמות המוזמנת עומדת במינימום (אלא אם כן היא 0)
      if (quantity > 0 && quantity < product.min_quantity) {
        alert(`הכמות עבור ${product.product_name} חייבת להיות לפחות ${product.min_quantity} או 0`);
        return;
      }
    }

    //product list to order
    const productsList = products.map((product) => ({
      product_id: product.id,
      quantity: quantities[product.product_name] || 0, 
    }));

    //more details about the order
    const orderData = {
      supplier_id,
      owner_id: userId,
      products_list: productsList,
    };

    try {
      //adding order
      const response = await axios.post(
        "http://localhost:3000/order/add",
        orderData,
      );

      if (response.status === 201) {
        console.log("Order placed successfully:", response.data);
        //for making the separate element of the orders refreshed to see the new order
        setRefresh((prev) => !prev);
        onClose();
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("שגיאה בהזמנה: " + (error.response?.data?.error || "נסה שוב מאוחר יותר"));
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
              <li key={product.product_id} className={styles.productItem}>
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
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>
                      {product.product_name}
                    </span>
                    <span className={styles.productPrice}>
                      ₪{product.unit_price}
                    </span>
                    <span className={styles.productMin}>
                      מינימום: {product.min_quantity}
                    </span>
                    <span className={styles.productStock}>
                      במלאי: {product.stock_quantity}
                    </span>
                    {isOutOfStock && (
                      <span className={styles.outOfStock}>אזל מהמלאי</span>
                    )}
                    {lowStock && !isOutOfStock && (
                      <span className={styles.lowStock}>מלאי נמוך</span>
                    )}
                  </div>
                </div>
                <div className={styles.quantityInput}>
                  <input
                    type="number"
                    min="0"
                    value={quantities[product.product_name] || 0}
                    disabled={isOutOfStock || lowStock}
                    onChange={(e) =>
                      handleQuantityChange(
                        product.product_name,
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className={styles.modalButtons}>
          <button className={styles.placeOrderButton} onClick={makeOrder}>
            סגור הזמנה
          </button>
          <button className={styles.closeButton} onClick={onClose}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupplierProductList;