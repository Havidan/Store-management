import pool from "./dbConnection.js";

/**
 * מחזיר מחוזות פעילים עם רשימת ערים פעילות בכל מחוז (עברית + IDs).
 * מחזיר מערך של אובייקטים: [{ district_id, district_name, cities: [{city_id, city_name}, ...] }, ...]
 */
export async function getDistrictsWithCities() {
  // נשאב בבת אחת כדי לצמצם round-trips
  const sql = `
    SELECT
      d.id   AS district_id,
      d.name_he AS district_name,
      c.id   AS city_id,
      c.name_he AS city_name
    FROM districts d
    LEFT JOIN cities c
      ON c.district_id = d.id
     AND c.is_active = 1
    WHERE d.is_active = 1
    ORDER BY d.name_he ASC, c.name_he ASC
  `;

  const [rows] = await pool.query(sql);

  // נהפוך להיררכיה: מחוז → ערים
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.district_id)) {
      map.set(r.district_id, {
        district_id: r.district_id,
        district_name: r.district_name,
        cities: [],
      });
    }
    if (r.city_id) {
      map.get(r.district_id).cities.push({
        city_id: r.city_id,
        city_name: r.city_name,
      });
    }
  }
  return Array.from(map.values());
}

/**
 * עוזר: כל הערים הפעילות בלבד (ל-autocomplete ברישום בעל מכולת).
 * מחזיר [{city_id, city_name, district_id, district_name}]
 */
export async function getAllActiveCities() {
  const sql = `
    SELECT
      c.id   AS city_id,
      c.name_he AS city_name,
      d.id   AS district_id,
      d.name_he AS district_name
    FROM cities c
    JOIN districts d ON d.id = c.district_id
    WHERE c.is_active = 1 AND d.is_active = 1
    ORDER BY c.name_he ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

export async function getCityIdsByDistrictIds(districtIds = []) {
  if (!districtIds?.length) return [];
  const placeholders = districtIds.map(() => "?").join(",");
  const sql = `
    SELECT c.id AS city_id
    FROM cities c
    WHERE c.is_active = 1 AND c.district_id IN (${placeholders})
  `;
  const [rows] = await pool.query(sql, districtIds);
  return rows.map(r => r.city_id);
}