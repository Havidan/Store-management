import pool from "./dbConnection.js";

/* =========================
 * Auth
 * ========================= */
export async function checkUser(username, password) {
  const u = (username || "").trim();
  const p = (password || "").trim();

  try {
    const [rows] = await pool.query(
      "SELECT userType, id FROM users WHERE username = ? AND password = ?",
      [u, p]
    );
    if (rows.length > 0) {
      return { userType: rows[0].userType, id: rows[0].id };
    }
    throw new Error("User not found or incorrect password.");
  } catch (err) {
    throw err;
  }
}

/* =========================
 * Register
 * ========================= */
export async function addUser(
  username,
  email,
  password,
  companyName,
  contactName,
  phone,
  userType,
  city_id = null,
  street = null,
  house_number = null,
  opening_time = null,
  closing_time = null
) {
  try {
    const sql = `
      INSERT INTO users
        (username, email, password, company_name, contact_name, phone, city_id, street, house_number, opening_time, closing_time, userType)
      VALUES
        (?,        ?,     ?,        ?,            ?,            ?,     ?,       ?,      ?,            ?,            ?,            ?)
    `;
    const [res] = await pool.query(sql, [
      username,
      email || null,
      password,
      companyName || null,
      contactName,
      phone,
      city_id ?? null,
      street || null,
      house_number || null,
      opening_time || null,
      closing_time || null,
      userType,
    ]);
    return res.insertId;
  } catch (err) {
    throw new Error("Error adding user: " + err.message);
  }
}

/* =========================
 * Public listing
 * ========================= */
export async function getUsers(userType) {
  try {
    const [rows] = await pool.query(
      `SELECT id, company_name, contact_name, phone FROM users WHERE userType = ?`,
      [userType]
    );
    return rows;
  } catch (err) {
    throw new Error("Error getting users: " + err.message);
  }
}

/* =========================
 * Supplier service areas — helpers
 * ========================= */
export async function addSupplierServiceCities(supplierId, cityIds = []) {
  if (!Array.isArray(cityIds) || cityIds.length === 0) return 0;
  const ids = cityIds.map(Number).filter(Number.isFinite);
  if (!ids.length) return 0;

  const placeholders = ids.map(() => "(?, ?)").join(",");
  const params = ids.flatMap((cid) => [supplierId, cid]);
  try {
    const sql = `INSERT IGNORE INTO supplier_cities (supplier_id, city_id) VALUES ${placeholders}`;
    await pool.query(sql, params);
    return ids.length;
  } catch (err) {
    throw new Error("addSupplierServiceCities failed: " + err.message);
  }
}

export async function addSupplierServiceDistricts(supplierId, districtIds = []) {
  if (!Array.isArray(districtIds) || districtIds.length === 0) return 0;
  const ids = districtIds.map(Number).filter(Number.isFinite);
  if (!ids.length) return 0;

  const placeholders = ids.map(() => "(?, ?)").join(",");
  const params = ids.flatMap((did) => [supplierId, did]);
  try {
    const sql = `INSERT IGNORE INTO supplier_districts (supplier_id, district_id) VALUES ${placeholders}`;
    await pool.query(sql, params);
    return ids.length;
  } catch (err) {
    throw new Error("addSupplierServiceDistricts failed: " + err.message);
  }
}

export async function getExistingCityIds(cityIds = []) {
  if (!Array.isArray(cityIds) || cityIds.length === 0) return [];
  const ids = cityIds.map(Number).filter(Number.isFinite);
  if (!ids.length) return [];
  try {
    const placeholders = ids.map(() => "?").join(",");
    const sql = `SELECT id FROM cities WHERE id IN (${placeholders}) AND is_active = 1`;
    const [rows] = await pool.query(sql, ids);
    return rows.map((r) => r.id);
  } catch (err) {
    throw new Error("getExistingCityIds failed: " + err.message);
  }
}

export async function getCityIdsByDistrictIds(districtIds = []) {
  if (!Array.isArray(districtIds) || districtIds.length === 0) return [];
  const ids = districtIds.map(Number).filter(Number.isFinite);
  if (!ids.length) return [];
  try {
    const placeholders = ids.map(() => "?").join(",");
    const sql = `
      SELECT id AS city_id
      FROM cities
      WHERE district_id IN (${placeholders})
        AND is_active = 1
    `;
    const [rows] = await pool.query(sql, ids);
    return rows.map((r) => r.city_id);
  } catch (err) {
    throw new Error("getCityIdsByDistrictIds failed: " + err.message);
  }
}
