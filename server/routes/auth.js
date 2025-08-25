// routes/auth.js
import express from "express";
import { checkUser } from "../../database/userDB.js";

const router = express.Router();

/**
 * POST /auth/login
 * בודק משתמש בסיסמה, ופותח session בקוקי HttpOnly
 */
router.post("/login", async (req, res) => {
  try {
    const { username = "", password = "" } = req.body || {};
    const { userType, id } = await checkUser(username, password);

    // נשמור מידע מינימלי ב-session
    req.session.user = { id, userType, username };
    // דוגמה לחלון זמן ברירת מחדל (אפשר לשנות ב-app.js)
    // req.session.cookie.maxAge = 8 * 60 * 60 * 1000; // 8h

    return res.json({
      message: "logged-in",
      user: req.session.user,
    });
  } catch (e) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

/**
 * GET /auth/me
 * מחזיר את המשתמש מה-session אם מחובר
 */

router.get("/me", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  return res.json({ user: req.session.user });
});

/**
 * POST /auth/logout
 * סוגר session ומנקה את הקוקי
 */
router.post("/logout", (req, res) => {
  if (!req.session) return res.json({ message: "ok" });
  req.session.destroy(() => {
    // ליתר ביטחון – מבקש מהדפדפן למחוק את הקוקי
    res.clearCookie("sid");
    return res.json({ message: "logged-out" });
  });
});

export default router;
