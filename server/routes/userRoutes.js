import express from "express";
import { checkUser, addUser, getUsers } from "../../database/userDB.js";

const router = express.Router();
router.post("/login", async (req, res) => {
    console.log("HIT /user/login:", req.body);   // <<< הוספה זמנית

  const { username, password } = req.body;
  try {
    const { userType, id } = await checkUser(username, password); 
    res.json({ userType, id }); 
  } catch (error) {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// routes/users.js (או היכן שהראוטר שלך)
router.post("/register", async (req, res) => {
  try {
    let {
      username,
      password,
      companyName,
      contactName,
      phone,
      userType,          // "Supplier" | "StoreOwner"
      city_id,           // לבעל חנות
      street,
      house_number,
      opening_hours,

      // הוספה: מגיע מהלקוח עבור ספק
      serviceCities = [],     // [city_id,...]
      serviceDistricts = [],  // [district_id,...]
    } = req.body;

    // ניקוי רווחים בסיסי
    username = (username || "").trim();
    password = (password || "").trim();
    companyName = (companyName || "").trim();
    contactName = (contactName || "").trim();
    phone = (phone || "").trim();
    street = (street || "").trim();
    house_number = (house_number || "").trim();
    opening_hours = (opening_hours || "").trim();

    const parsedCityId = Number.isFinite(+city_id) ? +city_id : null;

    // נרמול userType
    if (userType !== "Supplier" && userType !== "StoreOwner") {
      return res.status(400).json({ message: "userType חייב להיות 'Supplier' או 'StoreOwner'" });
    }

    // שדות חובה משותפים
    if (!username || !password || !contactName || !phone) {
      return res.status(400).json({ message: "שם משתמש, סיסמה, איש קשר וטלפון הם שדות חובה" });
    }

    // חובת שדות לפי תפקיד
    if (userType === "Supplier") {
      if (!companyName) {
        return res.status(400).json({ message: "ל'ספק' חובה להזין שם חברה (companyName)" });
      }
      // לספק אין כתובת/שעות פתיחה
      city_id = null;
      street = null;
      house_number = null;
      opening_hours = null;
    } else {
      // StoreOwner
      if (!parsedCityId) {
        return res.status(400).json({ message: "לבעל חנות חובה לבחור עיר חוקית (city_id)" });
      }
      if (!street) {
        return res.status(400).json({ message: "לבעל חנות חובה להזין רחוב (street)" });
      }
      if (!house_number) {
        return res.status(400).json({ message: "לבעל חנות חובה להזין מספר בית (house_number)" });
      }
      if (!opening_hours) {
        return res.status(400).json({ message: "לבעל חנות חובה להזין שעות פתיחה (opening_hours)" });
      }
      // לבעל חנות companyName רשות — נשמור NULL אם ריק
      if (!companyName) companyName = null;

      // להשלים לערכים שיכנסו לדטהבייס
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

    // אם זה ספק: שמירת ערי שירות (רישום ראשוני בלבד, ללא מחיקות)
    if (userType === "Supplier") {
      // הרחבת מחוזות לערים (רק פעילים)
      const districtCityIds = await getCityIdsByDistrictIds(
        Array.isArray(serviceDistricts) ? serviceDistricts : []
      );

      // איחוד ערים שנשלחו ישירות + ערים מהמחוזות (הסרת כפילויות)
      const unionCityIds = Array.from(
        new Set([
          ...(Array.isArray(serviceCities) ? serviceCities : []),
          ...districtCityIds,
        ])
      );

      // הכנסת הערים לטבלת supplier_cities (INSERT IGNORE, ללא מחיקת קודמים)
      await addSupplierServiceCities(userId, unionCityIds);
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
    return res.status(500).json({ message: "Error adding user", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userType } = req.query;
    const users = await getUsers(userType);
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching suppliers", error: error.message });
  }
});

export default router;
