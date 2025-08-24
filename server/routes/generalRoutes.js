import express from "express";
import { getDistrictsWithCities, getAllActiveCities } from "../../database/generalDB.js";
import { sendStyledEmail } from "../emailSenderApi.js"; // 👈 ודאי את הנתיב

const router = express.Router();

router.get("/districts-with-cities", async (req, res) => {
  try {
    const data = await getDistrictsWithCities();
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: "DB error", error: e.message });
  }
});

// מחזיר כל הערים הפעילות (ל-Autocomplete)
router.get("/cities", async (req, res) => {
  try {
    const rows = await getAllActiveCities();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "DB error", error: e.message });
  }
});

function fireAndForget(fn) {
  setImmediate(async () => {
    try { await fn(); }
    catch (e) { console.warn("[mail async] error:", e?.message || e); }
  });
}

// --- צור קשר: שליחת פנייה למייל ---
router.post("/contactForm", async (req, res) => {
  try {
    const { fullName, email, phone, subject, message, userId } = req.body || {};

    // ולידציה בסיסית בצד שרת
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // תשובה מידית ללקוח
    res.json({ ok: true });

    // שליחת מיילים "ברקע"
    fireAndForget(async () => {
      const TO = process.env.CONTACT_FORM_TO || "support@example.com";

      const esc = (s = "") =>
        String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

      // מייל לצוות / כתובת יעד
      await sendStyledEmail(
        TO,
        `צור קשר — ${esc(subject)}`,
        `
          <h2>פניית צור קשר חדשה</h2>
          <p><b>שם:</b> ${esc(fullName)}</p>
          <p><b>אימייל:</b> ${esc(email)}</p>
          ${phone ? `<p><b>טלפון:</b> ${esc(phone)}</p>` : ""}
          ${userId ? `<p><b>User ID:</b> ${esc(userId)}</p>` : ""}
          <hr />
          <p><b>נושא:</b> ${esc(subject)}</p>
          <p style="white-space:pre-wrap; line-height:1.6">${esc(message)}</p>
        `
      );

      // אישור אוטומטי לשולח (רשות)
      try {
        await sendStyledEmail(
          email,
          "קיבלנו את פנייתך",
          `
            <p>היי ${esc(fullName)},</p>
            <p>קיבלנו את פנייתך בנושא "${esc(subject)}" ונחזור אלייך בהקדם.</p>
            <p>תודה!</p>
          `
        );
      } catch (e) {
        // לא חוסם — רק לוג
        console.warn("[contact auto-reply] error:", e?.message || e);
      }
    });
  } catch (e) {
    console.error("contactForm error:", e);
    // אם קרסה השליחה לפני החזרת תשובה
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal error", error: e.message });
    }
  }
});


export default router;
