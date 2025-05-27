import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./SupplierProductList.module.css";

function SupplierProductList({ supplierId: supplier_id, onClose, setRefresh }) {
  const [products, setProducts] = useState([]);
  //quantities is object of pairs productName : amount
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    //get the product of specific supplier
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
    const productsForOrder = products.filter((product) => quantities[product.product_name])
    if (productsForOrder.length==0){
      alert("לא נבחרו מוצרים. לא ניתן לבצע הזמנה ריקה.")
      return;
    }

    //product list to order
    const productsList = products.map((product) => ({
      product_id: product.id,
      quantity: quantities[product.product_name] || 0, 
    }));

    //more detailes about the order
    const orderData = {
      supplier_id,
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
        //for making the seperate elemnt of ther orders refreshed to see the new order
        setRefresh((prev) => !prev);
        onClose();
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("שגיאה בהזמנה, נסה שוב מאוחר יותר");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>בחר מוצרים להזמנה</h3>
        <ul className={styles.productList}>
          {products.map((product) => (
            <li key={product.product_id} className={styles.productItem}>
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
              </div>
              <div className={styles.quantityInput}>
                <input
                  type="number"
                  min={product.min_quantity}
                  value={quantities[product.product_name] || 0}
                  onChange={(e) =>
                    handleQuantityChange(
                      product.product_name,
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
            </li>
          ))}
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
