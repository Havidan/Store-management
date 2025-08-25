import express from "express";
import {
  // קיימות – לא נוגעים בהן כדי לשמור תאימות
  getActiveSuppliersForOwner,
  getPendingSuppliersForOwner,
  getDiscoverSuppliersForOwner,
  createOrUpdateLinkRequest,
  cancelLinkRequest,
  getSupplierLinksV2,
  setLinkStatusBySupplierV2,

  // חדשות (V2) – תואמות סכמה/סטטוסים
  getDiscoverSuppliersForOwnerV2,
  createOrUpdateLinkRequestV2,
  cancelLinkRequestV2,
} from "../../database/linksDB.js";

// חדשים (Session Middleware)
import authRequired from "../middlewares/authRequired.js";
import requireRole from "../middlewares/requireRole.js";

const router = express.Router();

/** =========================
 *  קיים – בעלי חנויות (owner) עם ownerId ב-query
 * ========================= */
router.get("/owner/active", async (req, res) => {
  const ownerId = +req.query.ownerId;
  if (!ownerId) return res.status(400).json({ message: "ownerId required" });

  try {
    const rows = await getActiveSuppliersForOwner(ownerId);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "DB error", error: e.message });
  }
});

router.get("/owner/pending", async (req, res) => {
  const ownerId = +req.query.ownerId;
  if (!ownerId) return res.status(400).json({ message: "ownerId required" });

  try {
    const rows = await getPendingSuppliersForOwner(ownerId);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "DB error", error: e.message });
  }
});

// גרסה קיימת מבוססת V2 לגילוי ספקים (עדיין עם ownerId)
router.get("/owner/discover", async (req, res) => {
  const ownerId = +req.query.ownerId;
  if (!ownerId) return res.status(400).json({ message: "ownerId required" });

  try {
    const rows = await getDiscoverSuppliersForOwnerV2(ownerId);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "DB error", error: e.message });
  }
});

/** =========================
 *  קיים – יצירת/ביטול בקשה עם ownerId/supplierId ב-body
 * ========================= */
router.post("/request", async (req, res) => {
  const { ownerId, supplierId } = req.body || {};
  if (!+ownerId || !+supplierId) {
    return res.status(400).json({ message: "ownerId & supplierId required" });
  }

  try {
    const result = await createOrUpdateLinkRequestV2(+ownerId, +supplierId);
    const http = result.code || (result.ok ? 200 : 500);
    res.status(http).json(result);
  } catch (e) {
    res.status(500).json({ message: "DB error", error: e.message });
  }
});

router.post("/cancel", async (req, res) => {
  const { ownerId, supplierId } = req.body || {};
  if (!+ownerId || !+supplierId) {
    return res.status(400).json({ message: "ownerId & supplierId required" });
  }

  try {
    const result = await cancelLinkRequestV2(+ownerId, +supplierId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: "DB error", error: e.message });
  }
});

/** =========================
 *  קיים – צד ספק (supplier) עם supplierId ב-query
 * ========================= */
router.get("/mine", async (req, res) => {
  const role = String(req.query.role || "");
  const supplierId = Number(req.query.supplierId);
  const status = String(req.query.status || "").toUpperCase(); // PENDING/APPROVED

  if (role !== "Supplier") {
    return res.status(400).json({ message: "role must be Supplier" });
  }
  if (!supplierId) {
    return res.status(400).json({ message: "supplierId required" });
  }

  try {
    const rows = await getSupplierLinksV2(supplierId, status);
    return res.json(rows);
  } catch (e) {
    console.error("GET /links/mine (Supplier) failed:", e);
    return res.status(500).json({ message: "DB error", error: e.message });
  }
});

// שינוי סטטוס ע"י ספק (עם supplierId ב-body)
router.post("/decision", async (req, res) => {
  const { supplierId, ownerId, decision } = req.body || {};

  if (!Number(supplierId) || !Number(ownerId) || !decision) {
    return res.status(400).json({ message: "supplierId, ownerId, decision required" });
  }

  try {
    const result = await setLinkStatusBySupplierV2(Number(supplierId), Number(ownerId), decision);
    return res.status(result.code || (result.ok ? 200 : 500)).json(result);
  } catch (e) {
    console.error("POST /links/decision failed:", e);
    return res.status(500).json({ message: "DB error", error: e.message });
  }
});

/** =========================================================
 *  חדשות (Session) – ללא ownerId/supplierId שמגיעים מהלקוח
 * ========================================================= */

// בעלי חנויות: Active/Pending/Discover לפי ה-session
router.get("/owner/active/my", authRequired, requireRole("StoreOwner"), async (req, res) => {
  const ownerId = req.session.user.id;
  const rows = await getActiveSuppliersForOwner(ownerId);
  res.json(rows);
});

router.get("/owner/pending/my", authRequired, requireRole("StoreOwner"), async (req, res) => {
  const ownerId = req.session.user.id;
  const rows = await getPendingSuppliersForOwner(ownerId);
  res.json(rows);
});

router.get("/owner/discover/my", authRequired, requireRole("StoreOwner"), async (req, res) => {
  const ownerId = req.session.user.id;
  const rows = await getDiscoverSuppliersForOwnerV2(ownerId);
  res.json(rows);
});

// יצירת/ביטול בקשה – owner מה-session
router.post("/request/session", authRequired, requireRole("StoreOwner"), async (req, res) => {
  const ownerId = req.session.user.id;
  const { supplierId } = req.body || {};
  if (!+supplierId) return res.status(400).json({ message: "supplierId required" });
  const result = await createOrUpdateLinkRequestV2(ownerId, +supplierId);
  res.status(result.code || (result.ok ? 200 : 500)).json(result);
});

router.post("/cancel/session", authRequired, requireRole("StoreOwner"), async (req, res) => {
  const ownerId = req.session.user.id;
  const { supplierId } = req.body || {};
  if (!+supplierId) return res.status(400).json({ message: "supplierId required" });
  const result = await cancelLinkRequestV2(ownerId, +supplierId);
  res.json(result);
});

// ספקים: רשימות שלי לפי סטטוס
router.get("/mine/session", authRequired, requireRole("Supplier"), async (req, res) => {
  const supplierId = req.session.user.id;
  const status = String(req.query.status || "").toUpperCase(); // optional: PENDING/APPROVED
  const rows = await getSupplierLinksV2(supplierId, status);
  res.json(rows);
});

// ספק מחליט (APPROVE/REJECT) – supplier מה-session
router.post("/decision/session", authRequired, requireRole("Supplier"), async (req, res) => {
  const supplierId = req.session.user.id;
  const { ownerId, decision } = req.body || {};
  if (!+ownerId || !decision) return res.status(400).json({ message: "ownerId & decision required" });
  const result = await setLinkStatusBySupplierV2(supplierId, +ownerId, decision);
  res.status(result.code || (result.ok ? 200 : 500)).json(result);
});

export default router;
