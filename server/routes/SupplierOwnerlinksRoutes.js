// server/routes/linksRoutes.js
import express from "express";
import {
  // קיימות – לא נוגעים בהן כדי לא לשבור התאמות קיימות
  getActiveSuppliersForOwner,
  getPendingSuppliersForOwner,
  getDiscoverSuppliersForOwner,
  createOrUpdateLinkRequest,
  cancelLinkRequest,
  getSupplierLinksV2,
  setLinkStatusBySupplierV2,

  // חדשות (V2) – משתמשות ב-ENUM באותיות גדולות ו-created_at/updated_at
  getDiscoverSuppliersForOwnerV2,
  createOrUpdateLinkRequestV2,
  cancelLinkRequestV2,
} from "../../database/linksDB.js";

const router = express.Router();

/** GET /links/owner/active?ownerId=###  (ללא שינוי) */
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

/** GET /links/owner/pending?ownerId=###  (ללא שינוי) */
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

/**
 * GET /links/owner/discover?ownerId=###
 * משתמש בגרסת V2 שתואמת לסכמה (ומחזירה request_sent תואם ל-PENDING)
 */
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

/**
 * POST /links/request  { ownerId, supplierId }
 * משתמש ב-V2 כדי להכניס/לעדכן ל-PENDING עם created_at/updated_at
 */
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

/** POST /links/cancel { ownerId, supplierId } – גרסת V2 */
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

/**
 * POST /links/decision
 * body: { supplierId, ownerId, decision: "APPROVE"|"REJECT" }
 * שינוי סטטוס בקשה ע"י הספק.
 */
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


export default router;
