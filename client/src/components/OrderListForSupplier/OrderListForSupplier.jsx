import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./OrderListForSupplier.module.css";

function OrderListForSupplier() {
  const supplierId = localStorage.getItem("userId");

  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [displayHistory, setDisplayHistory] = useState(false);

  // סינון טווח תאריכים
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  useEffect(() => {
    axios
      .post("http://localhost:3000/order/by-id", {
        id: supplierId,
        userType: "supplier",
      })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Failed to fetch orders", err));
  }, [supplierId]);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => {
      const s = new Set(prev);
      s.has(orderId) ? s.delete(orderId) : s.add(orderId);
      return s;
    });
  };

  const isExpanded = (orderId) => expandedOrders.has(orderId);

  // ספק מאשר -> "בתהליך"
  const handleOrderArrivalConfirmation = async (orderId) => {
    try {
      const res = await axios.put(
        `http://localhost:3000/order/update-status/${orderId}`,
        { status: "בתהליך" }
      );
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, status: "בתהליך" } : o))
      );
      console.log(`Order ${orderId} status updated:`, res.data);
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const displayCompleteOrders = () => setDisplayHistory((p) => !p);

  // סכום הזמנה
  const toNumber = (v, fb = 0) => {
    if (v == null) return fb;
    if (typeof v === "number") return Number.isFinite(v) ? v : fb;
    let s = String(v).trim().replace(/[^\d.,\-]/g, "");
    if (s.includes(".") && s.includes(",")) s = s.replace(/,/g, "");
    else if (s.includes(",") && !s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,(?=\d{3}\b)/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : fb;
  };
  const calcOrderTotal = (order) => {
    if (order?.order_total != null) return toNumber(order.order_total, 0);
    if (Array.isArray(order?.products))
      return order.products.reduce(
        (sum, p) => sum + toNumber(p?.unit_price, 0) * toNumber(p?.quantity, 0),
        0
      );
    return 0;
  };
  const formatILS = (num) =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 2 })
      .format(toNumber(num, 0));

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
    const byStatus = orders.filter((o) =>
      displayHistory ? o.status === "הושלמה" : o.status !== "הושלמה"
    );
    if (!isDateFilterActive) return byStatus;
    return byStatus.filter((o) => inDateRange(o.created_date));
  }, [orders, displayHistory, dateFilter]);

  const clearDateFilter = () => setDateFilter({ from: "", to: "" });

  return (
    <div className={styles.ordersSection} dir="rtl">
      <h2 className={styles.title}>רשימת הזמנות לספק</h2>

      {/* פילטר תאריכים */}
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
            <button type="button" className={styles.clearFilterButton} onClick={clearDateFilter}>
              בטל סינון
            </button>
          )}
        </div>

        <button className={styles.historyButton} onClick={displayCompleteOrders}>
          {displayHistory ? "לצפיה בהזמנות שטרם סופקו" : "לצפיה בהיסטורית ההזמנות"}
        </button>
      </div>

      {/* כותרת: [מס' הזמנה][תאריך][שם חנות][סכום ההזמנה][סטטוס][פעולה][חץ] */}
      <div className={styles.orderHeaderRow}>
        <span>מס' הזמנה</span>
        <span>תאריך</span>
        <span>שם חנות</span>
        <span>סכום ההזמנה</span>
        <span>סטטוס</span>
        <span>פעולה</span>
        <span></span>
      </div>

      <div className={styles.orderList}>
        {filteredOrders.map((order) => (
          <div key={order.order_id} className={styles.orderRow}>
            <div className={styles.orderHeader} onClick={() => toggleExpand(order.order_id)}>
              <span>#{order.order_id}</span>
              <span>{new Date(order.created_date).toLocaleDateString()}</span>
              <span>{order.owner_company_name}</span>
              <span className={styles.orderAmount}>{formatILS(calcOrderTotal(order))}</span>
              <span>{order.status}</span>
              <div className={styles.orderAction}>
                {order.status === "בוצעה" && (
                  <button
                    className={styles.confirmButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderArrivalConfirmation(order.order_id);
                    }}
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
                {isExpanded(order.order_id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            </div>

            {isExpanded(order.order_id) && (
              <div className={styles.orderDetails}>
                {/* פרטי קשר בשורה אחת */}
                <div className={styles.detailsRow}>
                  <span className={styles.detailItem}>
                    <strong>שם החנות:</strong> {order.owner_company_name}
                  </span>
                  <span className={styles.detailItem}>
                    <strong>איש קשר:</strong> {order.owner_contact_name}
                  </span>
                  <span className={styles.detailItem}>
                    <strong>טלפון:</strong> {order.owner_phone}
                  </span>
                  <span className={styles.detailItem}>
                    <strong>שעות פתיחה:</strong> {order.owner_opening_time} - {order.owner_closing_time}
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
                        {order.products.map((p) => (
                          <tr key={p.product_id}>
                            <td>{p.product_id}</td>
                            <td>{p.product_name}</td>
                            <td>{p.quantity}</td>
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

export default OrderListForSupplier;
