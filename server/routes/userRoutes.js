import express from "express";
import {
  checkUser,
  addUser,
  getUsers,
  addSupplierServiceCities,
  addSupplierServiceDistricts,
  getCityIdsByDistrictIds,
  getExistingCityIds,
} from "../../database/userDB.js";

const router = express.Router();

/* =========================
 * Auth
 * ========================= */
router.post("/login", async (req, res) => {
  console.log("HIT /user/login:", req.body);
  const { username, password } = req.body;
  try {
    const { userType, id } = await checkUser(username, password);
    res.json({ userType, id });
  } catch {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

/* =========================
 * Register (StoreOwner | Supplier)
 * ========================= */
router.post("/register", async (req, res) => {
  try {
    let {
      username,
      email,
      password,
      companyName,
      contactName,
      phone,
      userType,          // "Supplier" | "StoreOwner"
      city_id,
      street,
      house_number,
      opening_time,
      closing_time,
      serviceCities = [],
      serviceDistricts = [],
    } = req.body;

    // ניקוי/נירמול
    username     = (username || "").trim();
    email        = (email || "").trim();
    password     = (password || "").trim();
    companyName  = (companyName || "").trim();
    contactName  = (contactName || "").trim();
    phone        = (phone || "").trim();
    street       = (street || "").trim();
    house_number = (house_number || "").trim();
    opening_time = (opening_time || "").trim();
    closing_time = (closing_time || "").trim();

    const parsedCityId = Number.isFinite(+city_id) ? +city_id : null;

    // ולידציות
    if (userType !== "Supplier" && userType !== "StoreOwner") {
      return res.status(400).json({ message: "userType חייב להיות 'Supplier' או 'StoreOwner'" });
    }
    if (!username || !password || !contactName || !phone) {
      return res.status(400).json({ message: "שם משתמש, סיסמה, איש קשר וטלפון הם חובה" });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailRe.test(email)) {
      return res.status(400).json({ message: "אימייל לא תקין" });
    }

    if (userType === "Supplier") {
      if (!companyName) {
        return res.status(400).json({ message: "ל'ספק' חובה להזין שם חברה" });
      }
      city_id = null; street = null; house_number = null; opening_time = null; closing_time = null;
    } else {
      if (!parsedCityId)  return res.status(400).json({ message: "לבעל חנות חובה לבחור עיר" });
      if (!street)       return res.status(400).json({ message: "רחוב חובה" });
      if (!house_number) return res.status(400).json({ message: "מספר בית חובה" });
      const hhmm = /^[0-2]\d:[0-5]\d$/;
      if (!hhmm.test(opening_time)) return res.status(400).json({ message: "opening_time בפורמט HH:MM" });
      if (!hhmm.test(closing_time)) return res.status(400).json({ message: "closing_time בפורמט HH:MM" });
      if (!companyName) companyName = null;
      city_id = parsedCityId;
    }

    // יצירת משתמש
    const userId = await addUser(
      username,
      email,
      password,
      companyName,
      contactName,
      phone,
      userType,
      city_id,
      street,
      house_number,
      opening_time,
      closing_time
    );

    // ספק — אזורי שירות ראשוניים
    if (userType === "Supplier") {
      const districtIds = Array.from(new Set((serviceDistricts || []).map((x) => +x))).filter(Number.isFinite);
      const cityIdsRaw  = Array.from(new Set((serviceCities || []).map((x) => +x))).filter(Number.isFinite);
      if (districtIds.length) await addSupplierServiceDistricts(userId, districtIds);
      const cityIdsFromDistricts = districtIds.length ? await getCityIdsByDistrictIds(districtIds) : [];
      const unionCityIds = Array.from(new Set([...cityIdsRaw, ...cityIdsFromDistricts]));
      const validCityIds = unionCityIds.length ? await getExistingCityIds(unionCityIds) : [];
      if (validCityIds.length) await addSupplierServiceCities(userId, validCityIds);
    }

    return res.status(201).json({ message: "User added successfully", userId });
  } catch (error) {
    if (error.message?.includes("ER_DUP_ENTRY") && error.message?.includes("uq_users_email")) {
      return res.status(409).json({ message: "האימייל כבר רשום במערכת" });
    }
    if (error.message?.includes("ER_DUP_ENTRY") && error.message?.includes("users.username")) {
      return res.status(409).json({ message: "שם המשתמש כבר תפוס" });
    }
    console.error("/user/register failed:", error);
    return res.status(500).json({ message: "Error adding user" });
  }
});

/* =========================
 * Public listing
 * ========================= */
router.get("/", async (req, res) => {
  try {
    const { userType } = req.query;
    const users = await getUsers(userType);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

export default router;
