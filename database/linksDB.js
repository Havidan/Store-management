// server/database/linksDB.js
import pool from "./dbConnection.js";

/** --- קיימות (לא שיניתי) --- */
export async function getOwnerCityId(ownerId) {
  const [[row]] = await pool.query(
    `SELECT city_id
     FROM users
     WHERE id = ? AND userType = 'StoreOwner'`,
    [ownerId]
  );
  return row?.city_id ?? null;
}

export async function getActiveSuppliersForOwner(ownerId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.company_name, s.contact_name, s.phone
     FROM owner_supplier_links l
     JOIN users s ON s.id = l.supplier_id
     WHERE l.owner_id = ? AND l.status = 'approved'`,
    [ownerId]
  );
  return rows;
}

export async function getPendingSuppliersForOwner(ownerId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.company_name, s.contact_name, s.phone
     FROM owner_supplier_links l
     JOIN users s ON s.id = l.supplier_id
     WHERE l.owner_id = ? AND l.status = 'pending'`,
    [ownerId]
  );
  return rows;
}

export async function getDiscoverSuppliersForOwner(ownerId) {
  const cityId = await getOwnerCityId(ownerId);
  if (!cityId) return [];

  const [rows] = await pool.query(
    `SELECT DISTINCT
        s.id,
        s.company_name,
        s.contact_name,
        s.phone,
        EXISTS(
          SELECT 1
          FROM owner_supplier_links l2
          WHERE l2.owner_id = ?
            AND l2.supplier_id = s.id
            AND l2.status = 'pending'
        ) AS request_sent
     FROM users s
     JOIN supplier_cities sc ON sc.supplier_id = s.id
     WHERE s.userType = 'Supplier'
       AND sc.city_id = ?
       AND NOT EXISTS (
         SELECT 1
         FROM owner_supplier_links l3
         WHERE l3.owner_id = ?
           AND l3.supplier_id = s.id
           AND l3.status = 'approved'
       )`,
    [ownerId, cityId, ownerId]
  );

  return rows;
}

export async function createOrUpdateLinkRequest(ownerId, supplierId) {
  await pool.query(
    `INSERT INTO owner_supplier_links (owner_id, supplier_id, status, requested_at)
     VALUES (?, ?, 'pending', NOW())
     ON DUPLICATE KEY UPDATE
       status = 'pending',
       requested_at = VALUES(requested_at)`,
    [ownerId, supplierId]
  );
  return { ok: true };
}

export async function cancelLinkRequest(ownerId, supplierId) {
  const [result] = await pool.query(
    `DELETE FROM owner_supplier_links
     WHERE owner_id = ? AND supplier_id = ? AND status = 'pending'`,
    [ownerId, supplierId]
  );
  return { ok: true, affected: result.affectedRows };
}

/** ------------------------------------------------------------------
 *                      פונקציות חדשות (V2) – הוספה בלבד
 *  תואמות לסכמה: ENUM('PENDING','APPROVED','REJECTED'), created_at/updated_at
 *  ומשלבות התאמה לפי עיר/מחוז (supplier_cities / supplier_districts).
 * ------------------------------------------------------------------ */

/** מביא גם city_id וגם district_id של בעל המכולת */
export async function getOwnerLocationV2(ownerId) {
  const [[row]] = await pool.query(
    `SELECT u.city_id AS owner_city_id, c.district_id AS owner_district_id
     FROM users u
     LEFT JOIN cities c ON c.id = u.city_id
     WHERE u.id = ? AND u.userType = 'StoreOwner'`,
    [ownerId]
  );
  return row || null;
}

/**
 * ספקים רלוונטיים לבעל המכולת:
 *  - ספק בעיר זהה
 *  - ספק שמצהיר על שירות לעיר (supplier_cities)
 *  - ספק שמצהיר על שירות למחוז (supplier_districts)
 *  - מסומן request_sent אם קיימת בקשה במצב PENDING
 *  - מוחרגים ספקים שכבר APPROVED מול אותו owner
 */
export async function getDiscoverSuppliersForOwnerV2(ownerId) {
  const loc = await getOwnerLocationV2(ownerId);
  if (!loc || !loc.owner_city_id) return [];

  const { owner_city_id } = loc;

  const [rows] = await pool.query(
    `
    SELECT
      s.id,
      s.company_name,
      s.contact_name,
      s.phone,
      /* האם יש בקשה ממתינה */
      EXISTS(
        SELECT 1
        FROM owner_supplier_links l2
        WHERE l2.owner_id = ?
          AND l2.supplier_id = s.id
          AND l2.status = 'PENDING'
      ) AS request_sent
    FROM users s
    /* התאמה לפי עיר של הספק */
    LEFT JOIN cities scity ON scity.id = s.city_id
    /* התאמה לפי שירות לעיר */
    LEFT JOIN supplier_cities sc ON sc.supplier_id = s.id AND sc.city_id = ?
    /* נזהה את המחוז של עיר ה-owner */
    LEFT JOIN cities oc ON oc.id = ?
    /* התאמה לפי שירות למחוז */
    LEFT JOIN supplier_districts sd ON sd.supplier_id = s.id AND sd.district_id = oc.district_id
    WHERE s.userType = 'Supplier'
      AND s.id <> ?
      AND (
        s.city_id = ?              /* ספק יושב באותה עיר */
        OR sc.city_id IS NOT NULL  /* ספק נותן שירות לעיר */
        OR sd.district_id IS NOT NULL /* ספק נותן שירות למחוז */
      )
      AND NOT EXISTS (
        SELECT 1
        FROM owner_supplier_links l3
        WHERE l3.owner_id = ?
          AND l3.supplier_id = s.id
          AND l3.status = 'APPROVED'
      )
    ORDER BY request_sent ASC, s.company_name ASC
    `,
    [
      ownerId,
      owner_city_id,
      owner_city_id,
      ownerId,
      owner_city_id,
      ownerId,
    ]
  );

  return rows;
}

/**
 * יצירת/ריענון בקשת חיבור:
 *  - אין רשומה: INSERT PENDING (created_at)
 *  - REJECTED: עדכון ל-PENDING (updated_at)
 *  - PENDING: שגיאה "כבר ממתינה"
 *  - APPROVED: שגיאה "כבר מאושר"
 */
export async function createOrUpdateLinkRequestV2(ownerId, supplierId) {
  // ולידציית משתמשים
  const [users] = await pool.query(
    `SELECT id, userType FROM users WHERE id IN (?, ?)`,
    [ownerId, supplierId]
  );
  const owner = users.find(u => u.id === Number(ownerId));
  const supplier = users.find(u => u.id === Number(supplierId));
  if (!owner || owner.userType !== "StoreOwner") {
    return { ok: false, code: 400, message: "Invalid ownerId" };
  }
  if (!supplier || supplier.userType !== "Supplier") {
    return { ok: false, code: 400, message: "Invalid supplierId" };
  }
  if (+ownerId === +supplierId) {
    return { ok: false, code: 400, message: "Owner and supplier cannot be the same user" };
  }

  const [[existing]] = await pool.query(
    `SELECT status FROM owner_supplier_links WHERE owner_id = ? AND supplier_id = ?`,
    [ownerId, supplierId]
  );

  if (!existing) {
    await pool.query(
      `INSERT INTO owner_supplier_links (owner_id, supplier_id, status, created_at)
       VALUES (?, ?, 'PENDING', NOW())`,
      [ownerId, supplierId]
    );
    return { ok: true, code: 201, message: "Connection request sent" };
  }

  const { status } = existing;

  if (status === "APPROVED") {
    return { ok: false, code: 409, message: "Already connected (APPROVED)" };
  }
  if (status === "PENDING") {
    return { ok: false, code: 409, message: "Request already pending" };
  }
  if (status === "REJECTED") {
    await pool.query(
      `UPDATE owner_supplier_links
       SET status = 'PENDING', updated_at = NOW()
       WHERE owner_id = ? AND supplier_id = ?`,
      [ownerId, supplierId]
    );
    return { ok: true, code: 200, message: "Request renewed and set to PENDING" };
  }

  return { ok: false, code: 500, message: "Unexpected link status" };
}

/** ביטול בקשה (גרסת V2 עם סטטוסים באותיות גדולות) */
export async function cancelLinkRequestV2(ownerId, supplierId) {
  const [result] = await pool.query(
    `DELETE FROM owner_supplier_links
     WHERE owner_id = ? AND supplier_id = ? AND status = 'PENDING'`,
    [ownerId, supplierId]
  );
  return { ok: true, affected: result.affectedRows };
}


/**
 * מחזיר את בעלי המכולת המקושרים לספק לפי סטטוס.
 * @param {number} supplierId
 * @param {"PENDING"|"APPROVED"} status
 * @returns [{ owner_id, supplier_id, status, created_at, updated_at, company_name, contact_name, phone }]
 */
export async function getSupplierLinksV2(supplierId, status) {
  const allowed = new Set(["PENDING", "APPROVED"]);
  const wanted = (status || "").toUpperCase();
  if (!allowed.has(wanted)) {
    return [];
  }

  const [rows] = await pool.query(
    `
    SELECT
      l.owner_id,
      l.supplier_id,
      l.status,
      l.created_at,
      l.updated_at,
      u.company_name,
      u.contact_name,
      u.phone
    FROM owner_supplier_links l
    JOIN users u ON u.id = l.owner_id AND u.userType = 'StoreOwner'
    WHERE l.supplier_id = ?
      AND l.status = ?
    ORDER BY l.created_at DESC
    `,
    [supplierId, wanted]
  );

  return rows;
}

/**
 * שינוי סטטוס בקשת חיבור ע"י הספק.
 * מותר: מ-PENDING ל-APPROVED/REJECTED.
 * @param {number} supplierId
 * @param {number} ownerId
 * @param {"APPROVE"|"REJECT"} decision
 */
export async function setLinkStatusBySupplierV2(supplierId, ownerId, decision) {
  const d = (decision || "").toUpperCase();
  const next =
    d === "APPROVE" ? "APPROVED" :
    d === "REJECT"  ? "REJECTED" : null;

  if (!next) {
    return { ok: false, code: 400, message: "Invalid decision" };
  }

  // חייבת להיות רשומה קיימת במצב PENDING
  const [[row]] = await pool.query(
    `SELECT status FROM owner_supplier_links WHERE owner_id = ? AND supplier_id = ?`,
    [ownerId, supplierId]
  );

  if (!row) {
    return { ok: false, code: 404, message: "Request not found" };
  }
  if (row.status === "APPROVED") {
    return { ok: false, code: 409, message: "Already APPROVED" };
  }
  if (row.status === "REJECTED") {
    return { ok: false, code: 409, message: "Already REJECTED" };
  }
  if (row.status !== "PENDING") {
    return { ok: false, code: 409, message: `Cannot change status from ${row.status}` };
  }

  await pool.query(
    `UPDATE owner_supplier_links
     SET status = ?, updated_at = NOW()
     WHERE owner_id = ? AND supplier_id = ?`,
    [next, ownerId, supplierId]
  );

  return { ok: true, code: 200, message: `Request ${next}` };
}