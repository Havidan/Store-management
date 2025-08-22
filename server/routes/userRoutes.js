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
      userType,
      address,         // חדש
      opening_hours,   // חדש
    } = req.body;

    // ניקוי רווחים בסיסי
    username = (username || "").trim();
    password = (password || "").trim();
    companyName = (companyName || "").trim();
    contactName = (contactName || "").trim();
    phone = (phone || "").trim();
    address = (address || "").trim();
    opening_hours = (opening_hours || "").trim();

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
      // לספק אין חובה לכתובת/שעות פתיחה
      address = null;
      opening_hours = null;
    } else if (userType === "StoreOwner") {
      if (!address) {
        return res.status(400).json({ message: "לבעל חנות חובה להזין כתובת (address)" });
      }
      if (!opening_hours) {
        return res.status(400).json({ message: "לבעל חנות חובה להזין שעות פתיחה (opening_hours)" });
      }
      // לבעל חנות companyName רשות — נשמור NULL אם ריק
      if (!companyName) companyName = null;
    }

    const userId = await addUser(
      username,
      password,
      companyName,
      contactName,
      phone,
      userType,
      address,
      opening_hours
    );

    return res.status(201).json({ message: "User added successfully", userId });
  } catch (error) {
    // ייחודיות שם משתמש → 409 (אם תרצי להבדיל)
    if (error.message?.includes("ER_DUP_ENTRY")) {
      return res.status(409).json({ message: "שם המשתמש כבר תפוס" });
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
