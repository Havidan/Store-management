// my-app/database/seedGeo.js
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function loadJson(relPath) {
  const file = path.resolve(process.cwd(), relPath);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function main() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "my_store",
    connectionLimit: 5,
    charset: "utf8mb4"
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    /** 1) districts.json → UPSERT למחוזות */
    const districts = await loadJson("database/seed/districts.json");

    const upsertDistrict = `
      INSERT INTO districts (name_he, name_en, is_active)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE
        name_en=VALUES(name_en),
        is_active=1
    `;

    for (const d of districts) {
      const name_he = (d.name_he || "").trim();
      const name_en = d.name_en || null;
      if (!name_he) continue;
      await conn.query(upsertDistrict, [name_he, name_en]);
    }

    // helper/cache להבאת/יצירת district_id לפי שם
    const districtIdCache = new Map();
    async function getOrCreateDistrictIdByName(name_he, name_en = null) {
      if (!name_he) return null;
      if (districtIdCache.has(name_he)) return districtIdCache.get(name_he);

      // נסה למצוא
      const [rows] = await conn.query(
        "SELECT id FROM districts WHERE name_he=? LIMIT 1",
        [name_he]
      );
      if (rows.length) {
        districtIdCache.set(name_he, rows[0].id);
        return rows[0].id;
      }

      // צור אם לא קיים (UPSERT לפי UNIQUE name_he)
      await conn.query(
        `INSERT INTO districts (name_he, name_en, is_active)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), is_active=1`,
        [name_he, name_en]
      );

      const [rows2] = await conn.query(
        "SELECT id FROM districts WHERE name_he=? LIMIT 1",
        [name_he]
      );
      const id = rows2[0]?.id || null;
      if (id) districtIdCache.set(name_he, id);
      return id;
    }

    /** 2) cities.json → UPSERT לערים (מחוז חובה) */
    const cities = await loadJson("database/seed/cities.json");

    const upsertCityByExternal = `
      INSERT INTO cities (external_id, district_id, name_he, name_en, is_active, updated_at, source)
      VALUES (?, ?, ?, ?, 1, NOW(), 'seed-json')
      ON DUPLICATE KEY UPDATE
        district_id=VALUES(district_id),
        name_he=VALUES(name_he),
        name_en=VALUES(name_en),
        is_active=1,
        updated_at=NOW(),
        source=VALUES(source)
    `;
    const upsertCityByName = `
      INSERT INTO cities (district_id, name_he, name_en, is_active, updated_at, source)
      VALUES (?, ?, ?, 1, NOW(), 'seed-json')
      ON DUPLICATE KEY UPDATE
        district_id=VALUES(district_id),
        name_en=VALUES(name_en),
        is_active=1,
        updated_at=NOW(),
        source=VALUES(source)
    `;

    for (const c of cities) {
      const name_he = (c.name_he || "").trim();
      if (!name_he) {
        throw new Error("נמצאה עיר ללא name_he בקובץ cities.json");
      }

      const name_en = c.name_en || null;
      const external_id = c.external_id || null;

      // מחוז חובה: district_id או district_name
      let district_id = c.district_id ?? null;

      if (!district_id && c.district_name) {
        district_id = await getOrCreateDistrictIdByName((c.district_name || "").trim(), null);
      }

      if (!district_id) {
        throw new Error(`העיר "${name_he}" חייבת להיות משויכת למחוז (district_id או district_name)`);
      }

      if (external_id) {
        await conn.query(upsertCityByExternal, [external_id, district_id, name_he, name_en]);
      } else {
        await conn.query(upsertCityByName, [district_id, name_he, name_en]);
      }
    }

    await conn.commit();
    console.log(`Seeded ${districts.length} districts and ${cities.length} cities (UPSERT, districts REQUIRED).`);
  } catch (e) {
    await conn.rollback();
    console.error("Seed geo failed:", e);
  } finally {
    conn.release();
    pool.end();
  }
}

main();
