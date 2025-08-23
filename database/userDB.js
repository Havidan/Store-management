import pool from "./dbConnection.js";

export async function checkUser(username, password) {
  const u = (username || '').trim();
  const p = (password || '').trim();

  console.log('DB in use: (about to query)');

  try {
    const [dbRows] = await pool.query('SELECT DATABASE() AS db');
    console.log('DB in use:', dbRows[0].db);

    const [results] = await pool.query(
      'SELECT userType, id FROM users WHERE username = ? AND password = ?',
      [u, p]
    );
    console.log('Rows found:', results.length, 'for', u);

    if (results.length > 0) {
      return { userType: results[0].userType, id: results[0].id };
    }
    throw new Error('User not found or incorrect password.');
  } catch (err) {
    console.error('DB ERROR:', err.message);
    throw err; // כדי שהראוטר יחזיר 401 כמו קודם
  }
}

/** שמירת משתמש חדש בהתאם לסכמת users */
export async function addUser(
  username,
  password,
  companyName,
  contactName,
  phone,
  userType,
  city_id = null,
  street = null,
  house_number = null,
  opening_hours = null
) {
  try {
    const query = `
      INSERT INTO users
        (username, password, company_name, contact_name, phone, city_id, street, house_number, opening_hours, userType)
      VALUES
        (?,       ?,        ?,            ?,            ?,     ?,       ?,      ?,            ?,             ?)
    `;
    const [results] = await pool.query(query, [
      username,
      password,
      companyName || null,
      contactName,
      phone,
      city_id ?? null,
      street || null,
      house_number || null,
      opening_hours || null,
      userType,
    ]);
    return results.insertId;
  } catch (err) {
    throw new Error("Error adding user: " + err.message);
  }
}

/**
 * מוסיף לרשימת הערים של הספק בטבלת supplier_cities.
 * אין מחיקות – רישום ראשוני בלבד. משתמש ב-INSERT IGNORE למניעת כפילויות.
 */
export async function addSupplierServiceCities(supplierId, cityIds = []) {
  if (!Array.isArray(cityIds) || cityIds.length === 0) return 0;

  const ids = cityIds.map(Number).filter(Number.isFinite);
  if (!ids.length) return 0;

  const placeholders = ids.map(() => "(?, ?)").join(",");
  const params = ids.flatMap(cid => [supplierId, cid]);

  try {
    const sql = `INSERT IGNORE INTO supplier_cities (supplier_id, city_id) VALUES ${placeholders}`;
    const [result] = await pool.query(sql, params);
    // result.affectedRows סופר גם שורות "התעלם", לכן נחזיר את מספר הערכים שניסינו להכניס
    return ids.length;
  } catch (err) {
    throw new Error("addSupplierServiceCities failed: " + err.message);
  }
}



export async function getUsers(userType) {
  try {
    const query = `
      SELECT id, company_name, contact_name, phone FROM users WHERE userType = ?
    `;
    const [results] = await pool.query(query, [userType]);

    return results;
  } catch (err) {
    throw new Error("Error getting suppliers: " + err.message);
  }
}
