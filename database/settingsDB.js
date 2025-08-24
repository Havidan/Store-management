import pool from "./dbConnection.js";

/* ============================================================
 * SETTINGS — STORE OWNER
 * ============================================================ */

export async function getOwnerSettingsById(userId) {
  try {
    const sql = `
      SELECT 
        u.id,
        u.company_name,
        u.contact_name,
        u.phone,
        u.email,
        u.city_id,
        c.name_he AS city_name,
        u.street,
        u.house_number,
        u.opening_time,
        u.closing_time
      FROM users u
      LEFT JOIN cities c ON c.id = u.city_id
      WHERE u.id = ? AND u.userType = 'StoreOwner'
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [userId]);
    return rows[0] || null;
  } catch (err) {
    throw new Error("getOwnerSettingsById failed: " + err.message);
  }
}

export async function updateOwnerSettings({
  userId,
  company_name,
  contact_name,
  phone,
  email,
  city_id,
  street,
  house_number,
  opening_time,
  closing_time,
}) {
  try {
    const sql = `
      UPDATE users
      SET 
        company_name = ?,
        contact_name = ?,
        phone = ?,
        email = ?,
        city_id = ?,
        street = ?,
        house_number = ?,
        opening_time = ?,
        closing_time = ?
      WHERE id = ? AND userType = 'StoreOwner'
    `;
    const params = [
      company_name || null,
      (contact_name || "").trim(),
      (phone || "").trim(),
      (email || "").trim(),
      Number(city_id),
      (street || "").trim(),
      (house_number || "").trim(),
      (opening_time || "").trim(),
      (closing_time || "").trim(),
      Number(userId),
    ];
    const [res] = await pool.query(sql, params);
    if (res.affectedRows === 0) {
      throw new Error("No StoreOwner row updated");
    }
    return true;
  } catch (err) {
    throw new Error("updateOwnerSettings failed: " + err.message);
  }
}

/* ============================================================
 * SETTINGS — SUPPLIER
 * ============================================================ */

export async function getSupplierSettingsById(userId) {
  try {
    const sqlUser = `
      SELECT 
        id,
        company_name,
        contact_name,
        phone,
        email
      FROM users
      WHERE id = ? AND userType = 'Supplier'
      LIMIT 1
    `;
    const [userRows] = await pool.query(sqlUser, [userId]);
    if (!userRows.length) return null;

    const sqlCities = `
      SELECT city_id
      FROM supplier_cities
      WHERE supplier_id = ?
      ORDER BY city_id
    `;
    const [cityRows] = await pool.query(sqlCities, [userId]);

    return {
      ...userRows[0],
      service_city_ids: cityRows.map((r) => r.city_id),
    };
  } catch (err) {
    throw new Error("getSupplierSettingsById failed: " + err.message);
  }
}

export async function updateSupplierProfile({
  userId,
  company_name,
  contact_name,
  phone,
  email,
}) {
  try {
    const sql = `
      UPDATE users
      SET 
        company_name = ?,
        contact_name = ?,
        phone = ?,
        email = ?
      WHERE id = ? AND userType = 'Supplier'
    `;
    const params = [
      (company_name || "").trim(),
      (contact_name || "").trim(),
      (phone || "").trim(),
      (email || "").trim(),
      Number(userId),
    ];
    const [res] = await pool.query(sql, params);
    if (res.affectedRows === 0) {
      throw new Error("No Supplier row updated");
    }
    return true;
  } catch (err) {
    throw new Error("updateSupplierProfile failed: " + err.message);
  }
}

/** החלפה מלאה של ערי שירות לספק (טרנזאקציה: מחיקה + הוספת הרשימה החדשה) */
export async function replaceSupplierServiceCities(supplierId, cityIds = []) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // מחיקת ערים קיימות
    await conn.query(`DELETE FROM supplier_cities WHERE supplier_id = ?`, [supplierId]);

    // סינון לערים קיימות ופעילות
    let valid = [];
    if (Array.isArray(cityIds) && cityIds.length) {
      const placeholders = cityIds.map(() => "?").join(",");
      const [rows] = await conn.query(
        `SELECT id FROM cities WHERE id IN (${placeholders}) AND is_active = 1`,
        cityIds.map(Number)
      );
      valid = rows.map((r) => r.id);
    }

    // הוספה מחודשת (אם יש)
    if (valid.length) {
      const values = valid.map(() => "(?, ?)").join(",");
      const params = valid.flatMap((cid) => [supplierId, cid]);
      await conn.query(
        `INSERT INTO supplier_cities (supplier_id, city_id) VALUES ${values}`,
        params
      );
    }

    await conn.commit();
    return valid.length;
  } catch (err) {
    await conn.rollback();
    throw new Error("replaceSupplierServiceCities failed: " + err.message);
  } finally {
    conn.release();
  }
}
