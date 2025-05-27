import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

/*
יצירה של בריכת חיבורים על מנת שלא נצטרך עבור כל בקשה של חיבור לדטה בייס ליצור חיבור חדש,
כאשר יש אפליקציה מרובת משתמשים מומלץ להשתמש בבריכת החיבורים לחסוך יצירות חוזרות ונשנות של חיבורים עבור כל בקשה בנפרד
מקסימום חיבורים בבריכה: 10, מוגדר שרירותית.
*/
const pool = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
  })
  /*
  השימוש בפרומייס מאפשר אסינכרוניות. כלומר שהבקשות שהפונקציות שמשתמשות בחיבורים יוכלו להיות אסינכרוניות.
  זה מעולה לנו כיוון שבקשות לשרת לעיתים לוקחות זמן.
   */
  .promise();

export default pool;
