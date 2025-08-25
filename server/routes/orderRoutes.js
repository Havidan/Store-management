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

// --- helpers ---
function isApproved(status = "") {
  const s = String(status).trim().toLowerCase();
  return ["approved", "אושרה", "אושר", "בתהליך"].includes(s);
}
function isDelivered(status = "") {
  const s = String(status).trim().toLowerCase();
  return ["delivered", "arrived", "received", "הושלמה", "נמסרה", "הגיעה"].includes(s);
}
function fireAndForget(fn) {
  setImmediate(async () => {
    try { await fn(); } catch (e) { console.warn("[mail async] error:", e?.message || e); }
  });
}

// =============== DRAFTS (session-based) ===============
/**
 * שמירת טיוטה:
 * body: { supplier_id: number, items: [{product_id:number, quantity:number}] }
 * נשמר ב-session תחת req.session.orderDrafts[supplier_id]
 */
router.post("/draft/save", authRequired, requireRole("StoreOwner"), (req, res) => {
  const { supplier_id, items } = req.body || {};
  if (!supplier_id) return res.status(400).json({ message: "supplier_id is required" });
  if (!Array.isArray(items)) return res.status(400).json({ message: "items must be an array" });

  req.session.orderDrafts ||= {};
  // נשמור רק פריטים עם quantity>0
  const cleanItems = items
    .filter(it => Number(it?.quantity) > 0 && Number.isFinite(Number(it?.product_id)))
    .map(it => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) }));

  req.session.orderDrafts[String(supplier_id)] = {
    supplier_id: Number(supplier_id),
    items: cleanItems,
    updatedAt: new Date().toISOString(),
  };
  res.status(200).json({ message: "Draft saved", draft: req.session.orderDrafts[String(supplier_id)] });
});

/** שליפת טיוטה לספק */
router.get("/draft/:supplierId", authRequired, requireRole("StoreOwner"), (req, res) => {
  const supplierId = String(req.params.supplierId);
  const all = req.session.orderDrafts || {};
  return res.status(200).json(all[supplierId] || null);
});

/** רשימת כל הטיוטות */
router.get("/drafts", authRequired, requireRole("StoreOwner"), (req, res) => {
  const all = req.session.orderDrafts || {};
  res.status(200).json(Object.values(all));
});

/** מחיקת טיוטה */
router.delete("/draft/:supplierId", authRequired, requireRole("StoreOwner"), (req, res) => {
  const supplierId = String(req.params.supplierId);
  if (req.session.orderDrafts && req.session.orderDrafts[supplierId]) {
    delete req.session.orderDrafts[supplierId];
  }
  res.status(200).json({ message: "Draft deleted", supplier_id: Number(supplierId) });
});

// =============== יצירת הזמנה רגילה (קיים) ===============
router.post("/add", authRequired, requireRole("StoreOwner"), async (req, res) => {
  try {
    const ownerIdFromSession = req.session?.user?.id || null;
    if (!ownerIdFromSession) {
      return res.status(401).json({ message: "Not authenticated as StoreOwner" });
    }
    req.body.owner_id = ownerIdFromSession;

    const { supplier_id, owner_id, products_list } = req.body;

    if (!supplier_id) return res.status(400).json({ message: "supplier_id is required" });
    if (!Array.isArray(products_list) || products_list.length === 0) {
      return res.status(400).json({ message: "products_list is required" });
    }

    const orderId = await addOrder(supplier_id, owner_id, "בוצעה", new Date());

    for (const { product_id, quantity } of products_list) {
      if (quantity > 0) {
        await addOrderItem(product_id, orderId, quantity);
      }
    }

    // מחיקת טיוטה לאחר סגירת הזמנה מוצלחת
    if (req.session.orderDrafts) {
      delete req.session.orderDrafts[String(supplier_id)];
    }

    res.status(201).json({ message: "Order added successfully", orderId });

    fireAndForget(async () => {
      const owner = await getUserEmailById(owner_id);
      const supplier = await getUserEmailById(supplier_id);
      if (owner?.email) {
        await sendStyledEmail(owner.email, "הזמנה נשלחה בהצלחה", `<p>הזמנה #${orderId} נשלחה בהצלחה לספק.</p>`);
      }
      if (supplier?.email) {
        const ownerName = owner?.company_name || owner?.contact_name || owner?.username || "בעל מכולת";
        await sendStyledEmail(
          supplier.email,
          "התקבלה הזמנה חדשה",
          `<p>התקבלה הזמנה חדשה מאת <b>${ownerName}</b>.</p><p>מספר הזמנה: #${orderId}</p>`
        );
      }
    });
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({ message: "Error adding order", error: error.message });
  }
});

// =============== קיים: שליפות/עדכונים ===============
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
    const result = await updateStatusOrder(orderId, status);
    res.status(200).json(result);

    fireAndForget(async () => {
      const p = await getOrderParticipants(orderId);
      if (!p) return;
      if (isApproved(status) && p.owner_email) {
        await sendStyledEmail(p.owner_email, "הספק אישר את הזמנתך", `<p>הזמנה #${orderId} אושרה.</p>`);
      }
      if (isDelivered(status) && p.supplier_email) {
        await sendStyledEmail(p.supplier_email, "בעל המכולת קיבל את ההזמנה", `<p>הזמנה #${orderId} התקבלה.</p>`);
      }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    if (error.message.includes("אין מספיק מלאי") || error.message.includes("שגיאה בעדכון המלאי")) {
      res.status(400).json({ message: "שגיאה בעדכון המלאי", error: error.message, success: false });
    } else {
      res.status(500).json({ message: "Error updating order status", error: error.message, success: false });
    }
  }
});

// הזמנות של המשתמש המחובר (Session)
router.get("/my", authRequired, async (req, res) => {
  try {
    const { id, userType } = req.session.user || {};
    const kind = userType === "StoreOwner" ? "owner" : "supplier";
    const orders = await getOrdersById(id, kind);
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error retrieving my orders:", error);
    return res.status(500).json({ message: "Error retrieving my orders" });
  }
});

export default router;
