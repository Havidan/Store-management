import pool from "./dbConnection.js";

export async function addProduct(
  supplier_id,
  product_name,
  unit_price,
  min_quantity,
  stock_quantity = 0,
  image_url = null
) {
  try {
    const query = `
      INSERT INTO products (supplier_id, product_name, unit_price, min_quantity, stock_quantity, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      supplier_id,
      product_name,
      unit_price,
      min_quantity,
      stock_quantity,
      image_url,
    ]);

    return result.insertId;
  } catch (err) {
    throw new Error("Error adding product: " + err.message);
  }
}

export async function getProductsBySupplier(supplierId) {
  try {
    const query = `
        SELECT id, product_name, unit_price, min_quantity, stock_quantity, image_url
        FROM products
        WHERE supplier_id = ?
      `;
    const [results] = await pool.query(query, [supplierId]);
    return results;
  } catch (err) {
    throw new Error("Error fetching products: " + err.message);
  }
}

export async function deleteProduct(productId, supplierId) {
  try {
    // בדיקה אם יש הזמנות "בתהליך" עם המוצר הזה
    const checkOrdersQuery = `
      SELECT COUNT(*) as count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ? 
        AND o.supplier_id = ? 
        AND o.status = 'בתהליך'
    `;
    
    const [orderCheck] = await pool.query(checkOrdersQuery, [productId, supplierId]);
    
    if (orderCheck[0].count > 0) {
      throw new Error("לא ניתן למחוק את המוצר - קיימות הזמנות פעילות בתהליך עבור מוצר זה");
    }

    // מחיקת המוצר
    const deleteQuery = `
      DELETE FROM products 
      WHERE id = ? AND supplier_id = ?
    `;
    
    const [result] = await pool.query(deleteQuery, [productId, supplierId]);
    
    if (result.affectedRows === 0) {
      throw new Error("המוצר לא נמצא או שאין הרשאה למחוק אותו");
    }

    return { success: true, message: "המוצר נמחק בהצלחה" };
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function updateProductStock(productId, newStockQuantity) {
  try {
    const query = `
      UPDATE products
      SET stock_quantity = ?
      WHERE id = ?
    `;
    
    const [result] = await pool.query(query, [newStockQuantity, productId]);
    
    if (result.affectedRows === 0) {
      throw new Error("המוצר לא נמצא");
    }

    return { success: true, message: "כמות המלאי עודכנה בהצלחה" };
  } catch (err) {
    throw new Error("Error updating product stock: " + err.message);
  }
}

export async function updateStockAfterOrder(productId, quantityOrdered) {
  try {
    const query = `
      UPDATE products
      SET stock_quantity = stock_quantity - ?
      WHERE id = ? AND stock_quantity >= ?
    `;
    
    const [result] = await pool.query(query, [quantityOrdered, productId, quantityOrdered]);
    
    if (result.affectedRows === 0) {
      throw new Error("אין מספיק מלאי עבור המוצר המבוקש");
    }

    return { success: true, message: "המלאי עודכן בהצלחה" };
  } catch (err) {
    throw new Error("Error updating stock after order: " + err.message);
  }
}

export async function updateProduct(productId, productName, unitPrice, minQuantity) {
  try {
    const query = `
      UPDATE products 
      SET product_name = ?, unit_price = ?, min_quantity = ?
      WHERE id = ?
    `;
    
    const [result] = await pool.query(query, [productName, unitPrice, minQuantity, productId]);
    
    if (result.affectedRows === 0) {
      throw new Error("המוצר לא נמצא");
    }

    return { 
      success: true, 
      message: "המוצר עודכן בהצלחה",
      productId: productId 
    };
  } catch (err) {
    throw new Error("Error updating product: " + err.message);
  }
}