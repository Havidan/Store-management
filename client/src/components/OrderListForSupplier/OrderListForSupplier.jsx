import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./OrderListForSupplier.module.css";

function OrderListForSupplier() {
  const supplierId = localStorage.getItem("userId");

  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [displayHistory, setDisplayHistory] = useState(false);

  useEffect(() => {
    axios
    //get the supplier orders
      .post("http://localhost:3000/order/by-id", {
        id: supplierId,
        userType: "supplier",
      })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Failed to fetch orders", err));
  }, [supplierId]);

  //when clicking on an order see the details
  const orderDetails = (orderId) => {
    setExpandedOrders((prev) => {
      //the set holds all orders that open for seeing their details
      const newSet = new Set(prev);
      //if it was open - close
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } 
      //if the order was close - open
      else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const isExpanded = (orderId) => expandedOrders.has(orderId);

  //to nake the order's status to be "in proccess"
  const handleOrderArrivalConfirmation = async (orderId) => {
    try {
      const res = await axios.put(
        `http://localhost:3000/order/update-status/${orderId}`,
        {
          status: "בתהליך",
        },
      );

      //for refreshing the orders' list
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === orderId ? { ...order, status: "בתהליך" } : order,
        ),
      );
      
      console.log(`Order ${orderId} status updated:`, res.data);
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  //to move between the orders in history or in proccess
  const displayCompleteOrders = async () => {
    setDisplayHistory((prev) => !prev);
  };

  return (
    <div className={styles.ordersSection}>
      <h2 className={styles.title}>רשימת הזמנות לספק</h2>
      <button className={styles.historyButton} onClick={displayCompleteOrders}>
        {displayHistory
          ? "לצפיה בהזמנות שטרם סופקו"
          : "לצפיה בהיסטורית ההזמנות"}
      </button>
      <div className={styles.orderHeaderRow}>
        <span>מס' הזמנה</span>
        <span>תאריך</span>
        <span>סטטוס</span>
        <span></span> 
      </div>

      <div className={styles.orderList}>
        {orders
          .filter((order) =>
            displayHistory
              ? order.status === "הושלמה"
              : order.status !== "הושלמה",
          )
          .map((order) => (
            <div key={order.order_id} className={styles.orderRow}>
              <div
                className={styles.orderHeader}
                onClick={() => orderDetails(order.order_id)}
              >
              <span>#{order.order_id}</span>
                <span>{new Date(order.created_date).toLocaleDateString()}</span>
                <span>{order.status}</span>
                <div className={styles.orderAction}>
                  {order.status === "בוצעה" && (
                    <button
                      className={styles.confirmButton}
                      onClick={() =>
                        handleOrderArrivalConfirmation(order.order_id)
                      }
                    >
                      לאישור קבלת הזמנה
                    </button>
                  )}

                  {order.status === "בתהליך" && (
                    <button className={styles.confirmButton} disabled>
                      ההזמנה אושרה
                    </button>
                  )}

                  {order.status === "הושלמה" && <div>ההזמנה הושלמה</div>}
                </div>
                <span className={styles.chevron}>
                  {isExpanded(order.order_id) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </span>
              </div>

              {isExpanded(order.order_id) && (
                <div className={styles.orderDetails}>
                  <p>
                    <strong>מוצרים:</strong>
                  </p>
                  <ul>
                    {order.products.map((product) => (
                      <li key={product.product_id}>
                        מספר מוצר: {product.product_id}, כמות:{" "}
                        {product.quantity}, שם מוצר: {product.product_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export default OrderListForSupplier;
