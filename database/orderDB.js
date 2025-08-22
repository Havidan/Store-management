import pool from "./dbConnection.js";

export async function addOrder(supplier_id, owner_id, status, created_date) {
  try {
    const query = `
        INSERT INTO orders (supplier_id, owner_id, status, created_date)
        VALUES (?, ?, ?, ?)
      `;
    const [result] = await pool.query(query, [
      supplier_id,
      owner_id,
      status,
      created_date,
    ]);

    return result.insertId;
  } catch (err) {
    throw new Error("Error adding product: " + err.message);
  }
}

export async function addOrderItem(product_id, order_id, quantity) {
  try {
    const query = `
        INSERT INTO order_items (product_id, order_id, quantity)
        VALUES (?, ?, ?)
      `;
    const [result] = await pool.query(query, [product_id, order_id, quantity]);

    return result.insertId;
  } catch (err) {
    throw new Error("Error adding product: " + err.message);
  }
}
/*
export async function getAllOrders() {
  try {
    const ordersQuery = `
        SELECT 
          o.id AS order_id,
          o.supplier_id,
          o.status,
          o.created_date,
          u.contact_name,
          u.phone,
          u.company_name
        FROM orders o
        JOIN users u ON o.supplier_id = u.id
      `;

    const [orders] = await pool.query(ordersQuery);

    //wait until all promises will finish
    const ordersWithItems = await Promise.all(
      //create an array of promises
      orders.map(async (order) => {
        const itemsQuery = `
            SELECT 
              oi.product_id, 
              oi.quantity, 
              p.product_name, 
              p.unit_price
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
          `;

        const [items] = await pool.query(itemsQuery, [order.order_id]);

        return {
          order_id: order.order_id,
          supplier_id: order.supplier_id,
          status: order.status,
          created_date: order.created_date,
          contact_name: order.contact_name,
          phone: order.phone,
          company_name: order.company_name,
          products: items,
        };
      }),
    );

    //print all fields with spaces
    console.log(JSON.stringify(ordersWithItems, null, 2));
    return ordersWithItems;
  } catch (err) {
    throw new Error("Error retrieving orders: " + err.message);
  }
}*/

export async function getOrdersById(id, userType) {

  try {
    let orders = []; // <-- הגדרה מחוץ לענפים


    if (userType === "supplier") {
      const ordersQuery = `
        SELECT 
          o.id AS order_id,
          o.created_date,
          o.status
        FROM orders o
        WHERE o.supplier_id = ?
      `;
    [orders] = await pool.query(ordersQuery, [id]);
    }
    else {
      const ordersQuery = `
        SELECT 
          o.id AS order_id,
          o.created_date,
          o.status
        FROM orders o
        WHERE o.owner_id = ?
      `;
      [orders] = await pool.query(ordersQuery, [id]);
    }

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const itemsQuery = `
            SELECT 
              oi.product_id, 
              oi.quantity, 
              p.product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
          `;

        const [items] = await pool.query(itemsQuery, [order.order_id]);

        return {
          order_id: order.order_id,
          created_date: order.created_date,
          status: order.status,
          products: items.map((item) => ({
            product_name: item.product_name,
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        };
      }),
    );

    return ordersWithItems;
  } catch (err) {
    throw new Error("Error retrieving orders for supplier: " + err.message);
  }
}

export async function updateStatusOrder(order_id, newStatus) {
  try {
    const query = `
        UPDATE orders
        SET status = ?
        WHERE id = ?
      `;
    const [result] = await pool.query(query, [newStatus, order_id]);

    if (result.affectedRows === 0) {
      throw new Error(`No order found with id ${order_id}`);
    }

    return {
      success: true,
      message: `Order ${order_id} status updated to '${newStatus}'`,
    };
  } catch (err) {
    throw new Error("Error updating order status: " + err.message);
  }
}
