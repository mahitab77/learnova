import pool from "../db.js";

export async function findParentProfileByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, phone, notes
     FROM parents
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  return rows?.[0] || null;
}

export async function ensureParentProfileRow(userId, input = {}) {
  const existing = await findParentProfileByUserId(userId);
  if (existing) {
    return { created: false, profile: existing };
  }

  const [result] = await pool.query(
    "INSERT INTO parents (user_id, phone, notes) VALUES (?, ?, ?)",
    [userId, input.phone || null, input.notes || null]
  );

  return {
    created: true,
    profile: {
      id: result.insertId,
      user_id: userId,
      phone: input.phone || null,
      notes: input.notes || null,
    },
  };
}
