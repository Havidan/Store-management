// routes/orderRoutes.js
import express from "express";
import {
  addOrder,
  addOrderItem,
  getOrdersById,
  updateStatusOrder,
  getUserEmailById,
  getOrderParticipants,
} from "../../database/orderDB.js";
import { updateStockAfterOrder } from "../../database/productDB.js";
import { sendStyledEmail } from "../emailSenderApi.js";
import authRequired from "../middlewares/authRequired.js";
import requireRole from "../middlewares/requireRole.js";

const router = express.Router();

// זיהוי סטטוסים בסיסי (אפשר לדייק לפי ה-ENUM אצלך)
function isApproved(status = "") {
  const s = String(status).trim().toLowerCase();
  return ["approved", "אושרה", "אושר", "בתהליך"].includes(s);
}
function isDelivered(status = "") {
  const s = String(status).trim().toLowerCase();
  return ["delivered", "arrived", "received", "הושלמה", "נמסרה", "הגיעה"].includes(s);
}

// עוזר קטן לשליחה אסינכרונית "ברקע" (ללא await)
function fireAndForget(fn) {
  setImmediate(async () => {
    try {
      await fn();
    } catch (e) {
      console.warn("[mail async] error:", e?.message || e);
    }
  });
}

// === יצירת הזמנה (StoreOwner בלבד, עם Session) ===
router.post("/add", authRequired, requireRole("StoreOwner"), async (req, res) => {
  try {
    const ownerIdFromSession = req.session?.user?.id || null;
    if (!ownerIdFromSession) {
      return res.status(401).json({ message: "Not authenticated as StoreOwner" });
    }

    // דריסה בטוחה של owner_id כדי לא להיות תלויים בלקוח
    req.body.owner_id = ownerIdFromSession;

    const { supplier_id, owner_id, products_list } = req.body;

    if (!supplier_id) {
      return res.status(400).json({ message: "supplier_id is required" });
    }
    if (!Array.isArray(products_list) || products_list.length === 0) {
      return res.status(400).json({ message: "products_list is required" });
    }

    // 1) יצירת הזמנה + פריטים (ללא עדכון מלאי - יתעדכן רק כשהספק יאשר)
    const orderId = await addOrder(supplier_id, owner_id, "בוצעה", new Date());

    for (const { product_id, quantity } of products_list) {
      if (quantity > 0) {
        await addOrderItem(product_id, orderId, quantity);
        // שימי לב: אין updateStockAfterOrder כאן (יתבצע באישור הספק)
      }
    }

    // 2) תשובה מידית ללקוח — ללא המתנה למיילים
    res.status(201).json({ message: "Order added successfully", orderId });

    // 3) שליחת מיילים אסינכרונית
    fireAndForget(async () => {
      const owner = await getUserEmailById(owner_id);
      const supplier = await getUserEmailById(supplier_id);

      if (owner?.email) {
        await sendStyledEmail(
          owner.email,
          "הזמנה נשלחה בהצלחה",
          `<p>הזמנה #${orderId} נשלחה בהצלחה לספק.</p>`
        );
      }

      if (supplier?.email) {
        const ownerName =
          owner?.company_name || owner?.contact_name || owner?.username || "בעל מכולת";
        await sendStyledEmail(
          supplier.email,
          "התקבלה הזמנה חדשה",
          `<p>התקבלה הזמנה חדשה מאת <b>${ownerName}</b>.</p>
           <p>מספר הזמנה: #${orderId}</p>`
        );
      }
    });
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({ message: "Error adding order", error: error.message });
  }
});

// routes/orders.js
router.post("/by-id", async (req, res) => {
  const { id, userType } = req.body;
  try {
    const orders = await getOrdersById(id, userType);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error retrieving orders for supplier:", error);
    res.status(500).json({ message: "Error retrieving orders for supplier" });
  }
});

router.put("/update-status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    // 1) עדכון סטטוס (כולל עדכון מלאי אם הסטטוס הוא "בתהליך")
    const result = await updateStatusOrder(orderId, status);

    // 2) תשובה מידית ללקוח
    res.status(200).json(result);

    // 3) מיילים אסינכרוניים לפי הסטטוס
    fireAndForget(async () => {
      const p = await getOrderParticipants(orderId);
      if (!p) return;

      // אישור הזמנה → מייל לבעל המכולת
      if (isApproved(status) && p.owner_email) {
        await sendStyledEmail(
          p.owner_email,
          "הספק אישר את הזמנתך",
          `<p>הספק אישר את הזמנתך #${orderId}.</p>`
        );
      }

      // בעל המכולת אישר שהגיעה (Delivered/הושלמה) → מייל לספק
      if (isDelivered(status) && p.supplier_email) {
        await sendStyledEmail(
          p.supplier_email,
          "בעל המכולת קיבל את ההזמנה",
          `<p>בעל המכולת אישר שההזמנה #${orderId} התקבלה.</p>`
        );
      }
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    // טיפול משופר בשגיאות מלאי
    if (
      error.message.includes("אין מספיק מלאי") ||
      error.message.includes("שגיאה בעדכון המלאי")
    ) {
      res.status(400).json({
        message: "שגיאה בעדכון המלאי",
        error: error.message,
        success: false,
      });
    } else {
      res.status(500).json({
        message: "Error updating order status",
        error: error.message,
        success: false,
      });
    }
  }
});

// GET /order/my - מחזיר הזמנות של המשתמש המחובר (מבוסס session)
router.get("/my", authRequired, async (req, res) => {
  try {
    const { id, userType } = req.session.user || {};
    // המרה לפורמט שה-DB מצפה לו
    const kind = userType === "StoreOwner" ? "owner" : "supplier";
    const orders = await getOrdersById(id, kind);
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error retrieving my orders:", error);
    return res.status(500).json({ message: "Error retrieving my orders" });
  }
});

export default router;
