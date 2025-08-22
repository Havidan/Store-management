import mysql from "mysql2";  //for connecting to mySql
import dotenv from "dotenv"; 
dotenv.config(); //Load environment variables to proccess

function initializeDatabase() {
  //create the base connection
  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  //connect by the connection
  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL:", err);
      return;
    }

    console.log("Connected to MySQL!");

    //execute queries
    connection.query(
      "CREATE DATABASE IF NOT EXISTS my_store",
      (err, results) => {
        if (err) {
          console.error("Error creating database:", err);
          return;
        }

        console.log("Database created or already exists!");

        connection.changeUser({ database: "my_store" }, (err) => {
          if (err) {
            console.error("Error switching to database:", err);
            return;
          }

          console.log("Switched to my_store database!");

          const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(255) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              company_name VARCHAR(255) NULL,
              contact_name VARCHAR(255) NULL,
              phone VARCHAR(20) NULL,
              address VARCHAR(255) NULL,          -- ← חדש
              opening_hours VARCHAR(255) NULL,    -- ← חדש
              userType ENUM('StoreOwner', 'Supplier') NOT NULL
            ) ENGINE=InnoDB;
          `;


          connection.query(createUsersTable, (err, results) => {
            if (err) {
              console.error("Error creating users table:", err);
              return;
            }

            console.log("Users table created or already exists!");

            const createProductsTable = `
            CREATE TABLE IF NOT EXISTS products (
              id INT AUTO_INCREMENT PRIMARY KEY,
              supplier_id INT NOT NULL,
              product_name VARCHAR(255) NOT NULL,
              unit_price DECIMAL(10, 2) NOT NULL,
              min_quantity INT NOT NULL,
              FOREIGN KEY (supplier_id) REFERENCES users(id)
            );
          `;

            const createOrdersTable = `
              CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                status ENUM('בתהליך', 'הושלמה', 'בוצעה') NOT NULL,
                supplier_id INT NOT NULL,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id),
                FOREIGN KEY (supplier_id) REFERENCES users(id)
              ) ENGINE=InnoDB;
            `;

            const createOrderedProductsTable = `
            CREATE TABLE IF NOT EXISTS order_items (
              id INT AUTO_INCREMENT PRIMARY KEY,
              product_id INT NOT NULL,
              order_id INT NOT NULL,
              quantity INT NOT NULL,
              FOREIGN KEY (product_id) REFERENCES products(id),
              FOREIGN KEY (order_id) REFERENCES orders(id)
            );
          `;

            connection.query(createProductsTable, (err, results) => {
              if (err) {
                console.error("Error creating products table:", err);
                return;
              }

              console.log("Products table created!");

              connection.query(createOrdersTable, (err, results) => {
                if (err) {
                  console.error("Error creating orders table:", err);
                  return;
                }

                console.log("Orders table created or already exists!");

                connection.query(createOrderedProductsTable, (err, results) => {
                  if (err) {
                    console.error(
                      "Error creating ordered_products table:",
                      err,
                    );
                    return;
                  }

                  console.log(
                    "Ordered products table created or already exists!",
                  );
                });
              });
            });
          });
        });
      },
    );
  });
}
initializeDatabase();
export default initializeDatabase;
