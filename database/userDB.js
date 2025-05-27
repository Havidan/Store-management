import pool from "./dbConnection.js";

export async function checkUser(username, password) {
  try {
    const query = `
      SELECT userType, id FROM users WHERE username = ? AND password = ?
    `;
    const [results] = await pool.query(query, [username, password]);
    if (results.length > 0) {
      return { userType: results[0].userType, id: results[0].id };
    } else {
      throw new Error("User not found or incorrect password.");
    }
  } catch (err) {
    throw new Error("Error checking user: " + err.message);
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
