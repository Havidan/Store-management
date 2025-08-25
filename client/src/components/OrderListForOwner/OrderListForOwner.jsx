import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "../OrderListForSupplier/OrderListForSupplier.module.css";
import axios from "axios";

function OrderListForOwner({ refresh }) {
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [displayHistory, setDisplayHistory] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ownerId] = useState(localStorage.getItem("userId"));

  // סינון טווח תאריכים
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  useEffect(() => {
    axios
      .post("http://localhost:3000/order/by-id", {
        id: ownerId,
        userType: "owner",
      })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Failed to fetch orders", err));
  }, [ownerId, refresh]);

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => {
      const s = new Set(prev);
      s.has(orderId) ? s.delete(orderId) : s.add(orderId);
      return s;
    });
  };

  const isExpanded = (orderId) => expandedOrders.has(orderId);

  // בעל חנות מאשר -> "הושלמה"
  const handleOrderArrivalConfirmation = async (orderId) => {
    try {
      const res = await axios.put(
        `http://localhost:3000/order/update-status/${orderId}`,
        { status: "הושלמה" }
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === orderId ? { ...order, status: "הושלמה" } : order
        )
      );
      console.log(`✅ Order ${orderId} status updated:`, res.data);
    } catch (err) {
      console.error("❌ Failed to update order status:", err);
    }
  };

  const displayCompleteOrders = () => setDisplayHistory((prev) => !prev);

  // סכום הזמנה
  const toNumber = (v, fallback = 0) => {
    if (v == null) return fallback;
    if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
    let s = String(v).trim().replace(/[^\d.,\-]/g, "");
    if (s.includes(".") && s.includes(",")) s = s.replace(/,/g, "");
    else if (s.includes(",") && !s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,(?=\d{3}\b)/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };

  const calcOrderTotal = (order) => {
    if (order?.order_total != null) return toNumber(order.order_total, 0);
    if (Array.isArray(order?.products)) {
      return order.products.reduce(
        (sum, p) => sum + toNumber(p?.unit_price, 0) * toNumber(p?.quantity, 0),
        0
      );
    }
    return 0;
  };

  // עזרי תאריכים
  const parseDateOnly = (str) => {
    if (!str) return null;
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const toLocalMidnight = (dt) => {
    const d = new Date(dt);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const inDateRange = (created_date) => {
    const day = toLocalMidnight(created_date);
    const from = parseDateOnly(dateFilter.from);
    const to = parseDateOnly(dateFilter.to);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  };

  const isDateFilterActive = dateFilter.from || dateFilter.to;

  const filteredOrders = useMemo(() => {
    const byStatus = orders.filter((order) =>
      displayHistory ? order.status === "הושלמה" : order.status !== "הושלמה"
    );
    if (!isDateFilterActive) return byStatus;
    return byStatus.filter((order) => inDateRange(order.created_date));
  }, [orders, displayHistory, dateFilter]);

  const clearDateFilter = () => setDateFilter({ from: "", to: "" });

  const formatILS = (num) =>
    new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 2,
    }).format(toNumber(num, 0));

  return (
    <div className={styles.ordersSection} dir="rtl">
      <h2 className={styles.title}>רשימת הזמנות</h2>

      {/* פילטר תאריכים + כפתור היסטוריה */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>סינון לפי תאריך:</span>

          <label className={styles.inlineLabel}>
            מתאריך
            <input
              type="date"
              className={styles.dateInput}
              value={dateFilter.from}
              onChange={(e) => setDateFilter((f) => ({ ...f, from: e.target.value }))}
            />
          </label>

          <label className={styles.inlineLabel}>
            עד תאריך
            <input
              type="date"
              className={styles.dateInput}
              value={dateFilter.to}
              onChange={(e) => setDateFilter((f) => ({ ...f, to: e.target.value }))}
            />
          </label>

          {isDateFilterActive && (
            <button
              type="button"
              className={styles.clearFilterButton}
              onClick={clearDateFilter}
              title="נקה את הסינון"
            >
              בטל סינון
            </button>
          )}
        </div>

        <button className={styles.historyButton} onClick={displayCompleteOrders}>
          {displayHistory ? "לצפיה בהזמנות שטרם סופקו" : "לצפיה בהיסטורית ההזמנות"}
        </button>
      </div>

      {/* כותרת: [מס' הזמנה][תאריך][חברת אספקה][סכום ההזמנה][סטטוס][פעולה][חץ] */}
      <div className={styles.orderHeaderRow}>
        <span>מס' הזמנה</span>
        <span>תאריך</span>
        <span>חברת אספקה</span>
        <span>סכום ההזמנה</span>
        <span>סטטוס</span>
        <span>פעולה</span>
        <span></span>
      </div>

      <div className={styles.orderList}>
        {filteredOrders.map((order) => (
          <div key={order.order_id} className={styles.orderRow}>
            <div
              className={styles.orderHeader}
              onClick={() => toggleOrder(order.order_id)}
              role="button"
              tabIndex={0}
            >
              <span>#{order.order_id}</span>
              <span>{new Date(order.created_date).toLocaleDateString()}</span>
              <span>{order.company_name}</span>
              <span className={styles.orderAmount}>{formatILS(calcOrderTotal(order))}</span>
              <span>{order.status}</span>

              <div className={styles.orderAction}>
                {order.status === "בוצעה" && <div>ממתין לאישור ספק</div>}
                {order.status === "בתהליך" && (
                  <button
                    className={styles.confirmButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderArrivalConfirmation(order.order_id);
                    }}
                  >
                    אשר הגעת הזמנה
                  </button>
                )}
                {order.status === "הושלמה" && <div>ההזמנה הושלמה</div>}
              </div>

              <span className={styles.chevron}>
                {isExpanded(order.order_id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            </div>

            {isExpanded(order.order_id) && (
              <div className={styles.orderDetails}>
                {/* פרטי ספק בשורה אחת */}
                <div className={styles.detailsRow}>
                  <span className={styles.detailItem}>
                    <strong>חברת אספקה:</strong> {order.company_name}
                  </span>
                  <span className={styles.detailItem}>
                    <strong>איש קשר:</strong> {order.contact_name}
                  </span>
                  <span className={styles.detailItem}>
                    <strong>טלפון:</strong> {order.phone}
                  </span>
                </div>

                {/* טבלת מוצרים פנימית */}
                {order.products?.length > 0 && (
                  <div className={styles.innerTableWrap}>
                    <table className={styles.innerTable}>
                      <thead>
                        <tr>
                          <th>מספר מוצר</th>
                          <th>שם מוצר</th>
                          <th>כמות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.products.map((product) => (
                          <tr key={product.product_id}>
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
