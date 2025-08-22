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




export async function addUser(
  username,
  password,
  companyName,
  contactName,
  phone,
  userType,
) {
  try {
    const query = `
      INSERT INTO users (username, password, company_name, contact_name, phone, userType)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    //will throw error if the user exist because username is unique value.
    const [results] = await pool.query(query, [
      username,
      password,
      companyName,
      contactName,
      phone,
      userType,
    ]);
    //increments automaticlly
    return results.insertId;
  } catch (err) {
    throw new Error("Error adding user: " + err.message);
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
