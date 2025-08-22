import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./OrderListForOwner.module.css";
import axios from "axios";

function OrderListForOwner({ refresh }) {
  
  //the set holds all orders that open for seeing their details
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  //true or false to display the completed orders or not
  const [displayHistory, setDisplayHistory] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ownerId, setOwnerId] = useState(localStorage.getItem("userId"));
  
  //the refresh is changed when the owner adds new order
  //the refresh is for updating in place the order list
  useEffect(() => {
    //get all orders
    axios
      .post("http://localhost:3000/order/by-id", {
        id: ownerId,
        userType: "owner",
      })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Failed to fetch orders", err));
  }, [refresh]);

  //when clicking on an order see the details
  const toggleOrder = (orderId) => {
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

  //to nake the order's status to be "complete"
  const handleOrderArrivalConfirmation = async (orderId) => {
    try {
      const res = await axios.put(
        `http://localhost:3000/order/update-status/${orderId}`,
        {
          status: "הושלמה",
        },
      );

      //for refreshing the orders' list without send new request to server
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === orderId ? { ...order, status: "הושלמה" } : order,
        ),
      );

      console.log(`✅ Order ${orderId} status updated:`, res.data);
    } catch (err) {
      console.error("❌ Failed to update order status:", err);
    }
  };

  //to move between the orders in history or in proccess
  const displayCompleteOrders = async () => {
    setDisplayHistory((prev) => !prev);
  };

  return (
    <div className={styles.ordersSection}>
      <h2 className={styles.title}>רשימת הזמנות</h2>
      <button className={styles.historyButton} onClick={displayCompleteOrders}>
        {displayHistory
          ? "לצפיה בהזמנות שטרם סופקו"
          : "לצפיה בהיסטורית ההזמנות"}
      </button>
      <div className={styles.orderHeaderRow}>
        <span>מס' הזמנה</span>
        <span>תאריך</span>
        <span>חברת אספקה</span>
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
                onClick={() => toggleOrder(order.order_id)}
              >
                <span className={styles.chevron}>
                  {isExpanded(order.order_id) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </span>
                <div className={styles.orderAction}>
                  {order.status === "בתהליך" && (
                    <button
                      className={styles.confirmButton}
                      onClick={() =>
                        handleOrderArrivalConfirmation(order.order_id)
                      }
                    >
                      אשר הגעת הזמנה
                    </button>
                  )}
                  {order.status === "הושלמה" && <div>ההזמנה הושלמה</div>}
                </div>
                <span>{order.status}</span>
                <span>{order.company_name}</span>
                <span>{new Date(order.created_date).toLocaleDateString()}</span>
                <span>#{order.order_id}</span>
              </div>

              {isExpanded(order.order_id) && (
                <div className={styles.orderDetails}>
                  <p>
                    <strong>איש קשר:</strong> {order.contact_name}
                  </p>
                  <p>
                    <strong>טלפון:</strong> {order.phone}
                  </p>
                  <p>
                    <strong>:מוצרים</strong>
                  </p>
                  {order.products.length > 0 && (
                    <div className={styles.productsTable}>
                      <table>
                        <thead>
                          <tr>
                            <th>מספר מוצר</th>
                            <th>שם מוצר</th>
                            <th>כמות</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.products.map((product) => (
                            <tr key={product.id}>
                              <td>{product.product_id}</td>
                              <td>{product.product_name}</td>
                              <td>{product.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export default OrderListForOwner;
