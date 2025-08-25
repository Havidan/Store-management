import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import styles from "./OrderListSupplier.module.css"; // ← החלפתי לשם החדש

// חדשים (Session Auth)
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";

function OrderListForSupplier() {
  // נשמר לתאימות לזרימה הישנה בלבד
  const supplierId = localStorage.getItem("userId");

  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [displayHistory, setDisplayHistory] = useState(false);

  // חדשים (Session Auth)
  const { USE_SESSION_AUTH } = useAuth();

  // סינון טווח תאריכים
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (USE_SESSION_AUTH) {
          const res = await api.get("/order/my"); // session-based
          setOrders(res.data);
        } else {
          const res = await axios.post("http://localhost:3000/order/by-id", {
            id: supplierId,
            userType: "supplier",
          });
          setOrders(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };
    fetchOrders();
  }, [USE_SESSION_AUTH, supplierId]);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => {
      const s = new Set(prev);
      s.has(orderId) ? s.delete(orderId) : s.add(orderId);
      return s;
    });
  };

  const isExpanded = (orderId) => expandedOrders.has(orderId);

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

  // ייצוא Excel
  const exportToExcel = () => {
    try {
      const ordersData = filteredOrders.map(order => ({
        'מספר הזמנה': order.order_id,
        'תאריך': new Date(order.created_date).toLocaleDateString('he-IL'),
        'סכום ההזמנה': calcOrderTotal(order),
        'סטטוס': order.status,
        'שם החנות': order.owner_company_name,
        'איש קשר': order.owner_contact_name,
        'טלפון': order.owner_phone,
        'שעות פתיחה': `${order.owner_opening_time} - ${order.owner_closing_time}`,
        'מספר מוצרים': order.products ? order.products.length : 0
      }));

      const productsData = [];
      filteredOrders.forEach(order => {
        if (order.products && Array.isArray(order.products)) {
          order.products.forEach(product => {
            productsData.push({
              'מספר הזמנה': order.order_id,
              'תאריך הזמנה': new Date(order.created_date).toLocaleDateString('he-IL'),
              'שם החנות': order.owner_company_name,
              'מספר מוצר': product.product_id,
              'שם מוצר': product.product_name || '',
              'כמות': product.quantity,
              'מחיר יחידה': product.unit_price || 0,
              'סכום מוצר': (product.unit_price || 0) * (product.quantity || 0)
            });
          });
        }
      });

      const workbook = XLSX.utils.book_new();
      const ordersWorksheet = XLSX.utils.json_to_sheet(ordersData);
      XLSX.utils.book_append_sheet(workbook, ordersWorksheet, 'הזמנות');

      if (productsData.length > 0) {
        const productsWorksheet = XLSX.utils.json_to_sheet(productsData);
        XLSX.utils.book_append_sheet(workbook, productsWorksheet, 'פירוט מוצרים');
      }

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      let fileName = `הזמנות_ספק_${dateStr}`;
      fileName += displayHistory ? '_היסטוריה' : '_פעילות';
      if (isDateFilterActive) fileName += '_מסונן';
      fileName += '.xlsx';

      XLSX.writeFile(workbook, fileName);
      console.log(`Excel file exported: ${fileName}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('שגיאה בייצוא הקובץ. נסה שוב.');
    }
  };

  return (
    <div className={styles.ordersSection}>
      <h2 className={styles.title}>רשימת הזמנות לספק</h2>

      {/* פילטר תאריכים + פעולות */}
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

        <div className={styles.actionButtons} style={{ display: "flex", gap: "10px" }}>
          <button 
            className={styles.exportButton} 
            onClick={exportToExcel}
            title={`ייצא ${filteredOrders.length} הזמנות לאקסל`}
          >
            <Download size={16} style={{ marginLeft: "5px" }} />
            ייצא ל-Excel ({filteredOrders.length} הזמנות)
          </button>
          <button className={styles.historyButton} onClick={() => setDisplayHistory(p => !p)}>
            {displayHistory ? "לצפיה בהזמנות שטרם סופקו" : "לצפיה בהיסטורית ההזמנות"}
          </button>
        </div>
      </div>

      {/* כותרת: [מס' הזמנה][תאריך][שם חנות][סכום][סטטוס][פעולה][חץ] */}
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
              <span>{new Date(order.created_date).toLocaleDateString("he-IL")}</span>
              <span>{order.owner_company_name}</span>
              <span className={styles.orderAmount}>{formatILS(calcOrderTotal(order))}</span>
              <span>{order.status}</span>

              <span className={styles.orderAction}>
                {order.status === "בוצעה" && (
                  <button
                    className={styles.exportButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderArrivalConfirmation(order.order_id);
                    }}
                  >
                    לאישור קבלת הזמנה
                  </button>
                )}
                {order.status === "בתהליך" && (
                  <button className={styles.exportButton} disabled>
                    ההזמנה אושרה
                  </button>
                )}
                {order.status === "הושלמה" && <div style={{ color: "#597e6d" }}>ההזמנה הושלמה</div>}
              </span>

              <span className={styles.chevron}>
                {isExpanded(order.order_id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            </div>

            {isExpanded(order.order_id) && (
              <div className={styles.orderDetails}>
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

        {filteredOrders.length === 0 && (
          <div style={{ padding: 16, color: "#6b7280" }}>לא נמצאו הזמנות בהתאם לסינון הנוכחי.</div>
        )}
      </div>
    </div>
  );
}

export default OrderListForSupplier;
