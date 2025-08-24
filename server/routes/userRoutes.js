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

router.post("/login", async (req, res) => {
  console.log("HIT /user/login:", req.body);
  const { username, password } = req.body;
  try {
    const { userType, id } = await checkUser(username, password);
    res.json({ userType, id });
  } catch (error) {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// Register user (StoreOwner | Supplier)
router.post("/register", async (req, res) => {
  try {
    let {
      username,
      password,
      companyName,
      contactName,
      phone,
      userType,          // "Supplier" | "StoreOwner"
      city_id,           // לבעל מכולת
      street,
      house_number,
      opening_hours,
      // ספק בלבד (רשות):
      serviceCities = [],    // [city_id,...]
      serviceDistricts = [], // [district_id,...]
    } = req.body;

    // ניקוי/נירמול בסיסי
    username = (username || "").trim();
    password = (password || "").trim();
    companyName = (companyName || "").trim();
    contactName = (contactName || "").trim();
    phone = (phone || "").trim();
    street = (street || "").trim();
    house_number = (house_number || "").trim();
    opening_hours = (opening_hours || "").trim();

    const parsedCityId = Number.isFinite(+city_id) ? +city_id : null;

    // ולידציית userType
    if (userType !== "Supplier" && userType !== "StoreOwner") {
      return res
        .status(400)
        .json({ message: "userType חייב להיות 'Supplier' או 'StoreOwner'" });
    }

    // חובה בשדות משותפים
    if (!username || !password || !contactName || !phone) {
      return res
        .status(400)
        .json({ message: "שם משתמש, סיסמה, איש קשר וטלפון הם שדות חובה" });
    }

    if (userType === "Supplier") {
      if (!companyName) {
        return res
          .status(400)
          .json({ message: "ל'ספק' חובה להזין שם חברה (companyName)" });
      }
      // שדות כתובת לא רלוונטיים לספק
      city_id = null;
      street = null;
      house_number = null;
      opening_hours = null;
    } else {
      // StoreOwner
      if (!parsedCityId) {
        return res
          .status(400)
          .json({ message: "לבעל חנות חובה לבחור עיר חוקית (city_id)" });
      }
      if (!street) {
        return res.status(400).json({ message: "לבעל חנות חובה להזין רחוב (street)" });
      }
      if (!house_number) {
        return res
          .status(400)
          .json({ message: "לבעל חנות חובה להזין מספר בית (house_number)" });
      }
      if (!opening_hours) {
        return res
          .status(400)
          .json({ message: "לבעל חנות חובה להזין שעות פתיחה (opening_hours)" });
      }
      // שם עסק רשות → NULL
      if (!companyName) companyName = null;
      city_id = parsedCityId;
    }

    // יצירת המשתמש
    const userId = await addUser(
      username,
      password,
      companyName,
      contactName,
      phone,
      userType,
      city_id,
      street,
      house_number,
      opening_hours
    );

    // ספק: שמירת אזורי שירות
    if (userType === "Supplier") {
      // נירמול מערכים למספרים + ייחוד
      const districtIds = Array.from(
        new Set((Array.isArray(serviceDistricts) ? serviceDistricts : []).map((x) => +x))
      ).filter(Number.isFinite);

      const cityIdsRaw = Array.from(
        new Set((Array.isArray(serviceCities) ? serviceCities : []).map((x) => +x))
      ).filter(Number.isFinite);

      // שמירת מחוזות כפי שהם (לוג/דוחות/חיפושים מהירים)
      if (districtIds.length) {
        await addSupplierServiceDistricts(userId, districtIds);
      }

      // הרחבת מחוזות -> רשימת ערים פעילות + איחוד עם ערים שסומנו ידנית
      const cityIdsFromDistricts = districtIds.length
        ? await getCityIdsByDistrictIds(districtIds)
        : [];

      const unionCityIds = Array.from(new Set([...cityIdsRaw, ...cityIdsFromDistricts]));

      // סינון לבטוח שקיימות (ונמנעים משגיאות FK)
      const validCityIds = unionCityIds.length
        ? await getExistingCityIds(unionCityIds)
        : [];

      if (validCityIds.length) {
        await addSupplierServiceCities(userId, validCityIds);
      }
    }

    return res.status(201).json({ message: "User added successfully", userId });
  } catch (error) {
    // ייחודיות שם משתמש → 409
    if (error.message?.includes("ER_DUP_ENTRY")) {
      return res.status(409).json({ message: "שם המשתמש כבר תפוס" });
    }
    // שגיאת FK על city_id לא חוקי
    if (error.message?.includes("ER_NO_REFERENCED_ROW")) {
      return res.status(400).json({ message: "city_id לא קיים בטבלת הערים" });
    }
    console.error("/user/register failed:", error);
    return res.status(500).json({ message: "Error adding user", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userType } = req.query;
    const users = await getUsers(userType);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

export default router;
