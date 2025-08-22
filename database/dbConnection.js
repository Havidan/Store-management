// database/dbConnection.js
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// קובץ .env יושב בתיקיית my-app (תיקייה אחת מעל database)
dotenv.config({ path: path.join(__dirname, "../.env") });


// יצירת pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE,               // לדוגמה: 'storedb'
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  waitForConnections: true,
});

export default pool;
