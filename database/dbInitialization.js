import mysql from "mysql2";  // for connecting to MySQL
import dotenv from "dotenv";
dotenv.config(); // Load environment variables to process

function initializeDatabase() {
  // create the base connection
  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  // connect
  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL:", err);
      return;
    }
    console.log("Connected to MySQL!");

    // create DB
    connection.query("CREATE DATABASE IF NOT EXISTS my_store", (err) => {
      if (err) {
        console.error("Error creating database:", err);
        return;
      }
      console.log("Database created or already exists!");

      // switch DB
      connection.changeUser({ database: "my_store" }, (err) => {
        if (err) {
          console.error("Error switching to database:", err);
          return;
        }
        console.log("Switched to my_store database!");

        // 1) Cities (must exist before users due to FK)
        const createCitiesTable = `
          CREATE TABLE IF NOT EXISTS cities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name_he VARCHAR(255) NOT NULL UNIQUE,
            name_en VARCHAR(255) NULL,
            is_active TINYINT(1) DEFAULT 1
          ) ENGINE=InnoDB;
        `;

        // 2) Users (with city_id, street, house_number, opening_hours)
        const createUsersTable = `
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            company_name VARCHAR(255) NULL,
            contact_name VARCHAR(255) NULL,
            phone VARCHAR(20) NULL,
            city_id INT NULL,
            street VARCHAR(255) NULL,
            house_number VARCHAR(32) NULL,
            opening_hours VARCHAR(255) NULL,
            userType ENUM('StoreOwner', 'Supplier') NOT NULL,
            FOREIGN KEY (city_id) REFERENCES cities(id)
          ) ENGINE=InnoDB;
        `;

        // 3) Products (belong to supplier user)
        const createProductsTable = `
          CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            supplier_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            unit_price DECIMAL(10, 2) NOT NULL,
            min_quantity INT NOT NULL,
            FOREIGN KEY (supplier_id) REFERENCES users(id)
          ) ENGINE=InnoDB;
        `;

        // 4) Orders (now includes owner_id)
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

        // 5) Order items
        const createOrderedProductsTable = `
          CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            order_id INT NOT NULL,
            quantity INT NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
          ) ENGINE=InnoDB;
        `;

        // 6) Supplier service areas (supplier ↔ cities)
        const createSupplierCitiesTable = `
          CREATE TABLE IF NOT EXISTS supplier_cities (
            supplier_id INT NOT NULL,
            city_id INT NOT NULL,
            PRIMARY KEY (supplier_id, city_id),
            FOREIGN KEY (supplier_id) REFERENCES users(id),
            FOREIGN KEY (city_id) REFERENCES cities(id)
          ) ENGINE=InnoDB;
        `;

        // 7) Owner↔Supplier link requests/approvals
        const createOwnerSupplierLinksTable = `
          CREATE TABLE IF NOT EXISTS owner_supplier_links (
            owner_id INT NOT NULL,
            supplier_id INT NOT NULL,
            status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL,
            PRIMARY KEY (owner_id, supplier_id),
            FOREIGN KEY (owner_id) REFERENCES users(id),
            FOREIGN KEY (supplier_id) REFERENCES users(id)
          ) ENGINE=InnoDB;
        `;

        // Run in dependency order
        connection.query(createCitiesTable, (err) => {
          if (err) { console.error("Error creating cities table:", err); return; }
          console.log("Cities table created or already exists!");

          connection.query(createUsersTable, (err) => {
            if (err) { console.error("Error creating users table:", err); return; }
            console.log("Users table created or already exists!");

            connection.query(createProductsTable, (err) => {
              if (err) { console.error("Error creating products table:", err); return; }
              console.log("Products table created or already exists!");

              connection.query(createOrdersTable, (err) => {
                if (err) { console.error("Error creating orders table:", err); return; }
                console.log("Orders table created or already exists!");

                connection.query(createOrderedProductsTable, (err) => {
                  if (err) { console.error("Error creating order_items table:", err); return; }
                  console.log("Order items table created or already exists!");

                  connection.query(createSupplierCitiesTable, (err) => {
                    if (err) { console.error("Error creating supplier_cities table:", err); return; }
                    console.log("Supplier_cities table created or already exists!");

                    connection.query(createOwnerSupplierLinksTable, (err) => {
                      if (err) { console.error("Error creating owner_supplier_links table:", err); return; }
                      console.log("Owner_supplier_links table created or already exists!");
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

initializeDatabase();
export default initializeDatabase;
