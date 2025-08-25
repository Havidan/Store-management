import express from "express";
import {
  getOwnerSettingsById,
  updateOwnerSettings,
  getSupplierSettingsById,
  updateSupplierProfile,
  replaceSupplierServiceCities,
} from "../../database/settingsDB.js";

// חדשים — אימות מבוסס Session
import authRequired from "../middlewares/authRequired.js";
import requireRole from "../middlewares/requireRole.js";

const router = express.Router();

/* =========================
 * Owner Settings (קיים – לפי userId מהלקוח)
 * ========================= */
router.get("/owner", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!Number.isFinite(userId)) return res.status(400).json({ message: "userId נדרש" });
    const data = await getOwnerSettingsById(userId);
    if (!data) return res.status(404).json({ message: "Owner not found" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch owner settings" });
  }
});

router.put("/owner", async (req, res) => {
  try {
    await updateOwnerSettings(req.body);
    res.json({ success: true });
  } catch (e) {
    if (e.message?.includes("ER_DUP_ENTRY")) {
      return res.status(409).json({ message: "האימייל כבר בשימוש" });
    }
    res.status(500).json({ message: "Failed to update owner settings" });
  }
});

/* =========================
 * Supplier Settings (קיים – לפי userId מהלקוח)
 * ========================= */
router.get("/supplier", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!Number.isFinite(userId)) return res.status(400).json({ message: "userId נדרש" });
    const data = await getSupplierSettingsById(userId);
    if (!data) return res.status(404).json({ message: "Supplier not found" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch supplier settings" });
  }
});

router.put("/supplier", async (req, res) => {
  try {
    await updateSupplierProfile(req.body);
    res.json({ success: true });
  } catch (e) {
    if (e.message?.includes("ER_DUP_ENTRY")) {
      return res.status(409).json({ message: "האימייל כבר בשימוש" });
    }
    res.status(500).json({ message: "Failed to update supplier profile" });
  }
});

router.put("/supplier/service-cities", async (req, res) => {
  try {
    const { userId, cityIds } = req.body;
    const count = await replaceSupplierServiceCities(userId, cityIds);
    res.json({ success: true, saved_count: count });
  } catch (e) {
    res.status(500).json({ message: "Failed to update service cities" });
  }
});

/* =======================================================
 * נתיבי Session חדשים – מזהים userId מה־session (לא מהלקוח)
 * ======================================================= */

// בעל/ת מכולת – שליפה/עדכון של הפרופיל שלי
router.get("/owner/my", authRequired, requireRole("StoreOwner"), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const data = await getOwnerSettingsById(userId);
    if (!data) return res.status(404).json({ message: "Owner not found" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch owner settings" });
  }
});

router.put("/owner/my", authRequired, requireRole("StoreOwner"), async (req, res) => {
  try {
    const userId = req.session.user.id;
    await updateOwnerSettings({ ...req.body, userId });
    res.json({ success: true });
  } catch (e) {
    if (e.message?.includes("ER_DUP_ENTRY")) {
      return res.status(409).json({ message: "האימייל כבר בשימוש" });
    }
    res.status(500).json({ message: "Failed to update owner settings" });
  }
});

// ספק/ית – שליפה/עדכון של הפרופיל שלי
router.get("/supplier/my", authRequired, requireRole("Supplier"), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const data = await getSupplierSettingsById(userId);
    if (!data) return res.status(404).json({ message: "Supplier not found" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch supplier settings" });
  }
});

router.put("/supplier/my", authRequired, requireRole("Supplier"), async (req, res) => {
  try {
    const userId = req.session.user.id;
    await updateSupplierProfile({ ...req.body, userId });
    res.json({ success: true });
  } catch (e) {
    if (e.message?.includes("ER_DUP_ENTRY")) {
      return res.status(409).json({ message: "האימייל כבר בשימוש" });
    }
    res.status(500).json({ message: "Failed to update supplier profile" });
  }
});

// ספק/ית – עדכון ערי שירות שלי
router.put(
  "/supplier/service-cities/my",
  authRequired,
  requireRole("Supplier"),
  async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { cityIds } = req.body || {};
      const count = await replaceSupplierServiceCities(userId, cityIds || []);
      res.json({ success: true, saved_count: count });
    } catch (e) {
      res.status(500).json({ message: "Failed to update service cities" });
    }
  }
);

export default router;
