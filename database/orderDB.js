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

/**
 * מחזיר הזמנות לפי משתמש (supplier/owner) כולל פרטי איש קשר:
 * - אם userType === "supplier": נחזיר הזמנות של הספק + פרטי בעל המכולת (owner_*), כולל opening_time/closing_time.
 * - אחרת (owner): נחזיר הזמנות של הבעלים + פרטי הספק (company_name/contact_name/phone).
 */
export async function getOrdersById(id, userType) {
  try {
    let orders = [];

    if (userType === "supplier") {
      const ordersQuery = `
        SELECT 
          o.id AS order_id,
          o.created_date,
          o.status,
          uo.company_name   AS owner_company_name,
          uo.contact_name   AS owner_contact_name,
          uo.phone          AS owner_phone,
          uo.opening_time   AS owner_opening_time,
          uo.closing_time   AS owner_closing_time
        FROM orders o
        JOIN users uo ON uo.id = o.owner_id AND uo.userType = 'StoreOwner'
        WHERE o.supplier_id = ?
        ORDER BY o.created_date DESC
      `;
      [orders] = await pool.query(ordersQuery, [id]);
    } else {
      const ordersQuery = `
        SELECT 
          o.id AS order_id,
          o.created_date,
          o.status,
          us.company_name,
          us.contact_name,
          us.phone
        FROM orders o
        JOIN users us ON us.id = o.supplier_id AND us.userType = 'Supplier'
        WHERE o.owner_id = ?
        ORDER BY o.created_date DESC
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

        const base = {
          order_id: order.order_id,
          created_date: order.created_date,
          status: order.status,
          products: items.map((item) => ({
            product_name: item.product_name,
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        };

        if (userType === "supplier") {
          return {
            ...base,
            owner_company_name: order.owner_company_name,
            owner_contact_name: order.owner_contact_name,
            owner_phone: order.owner_phone,
            owner_opening_time: order.owner_opening_time, // TIME
            owner_closing_time: order.owner_closing_time, // TIME
          };
        } else {
          return {
            ...base,
            company_name: order.company_name,
            contact_name: order.contact_name,
            phone: order.phone,
          };
        }
      })
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
