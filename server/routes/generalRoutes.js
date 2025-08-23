import express from "express";
import { getDistrictsWithCities, getAllActiveCities } from "../../database/generalDB.js";

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

export default router;
