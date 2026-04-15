export function getRequestSessionUser(req) {
  return req.user || req.session?.user || null;
}

export function parsePositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function regenerateSession(req) {
  await new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

export async function saveSession(req) {
  await new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

export async function clearSwitchSnapshot(req) {
  delete req.session.parent_user;
  delete req.session.switch_ctx;
  await new Promise((resolve) => {
    req.session.save(() => resolve());
  });
}

export async function findLinkedStudentForParent(pool, parentId, studentUserId) {
  const [linkRows] = await pool.query(
    `
      SELECT
        s.id     AS student_id,
        CASE WHEN ps.has_own_login = 1 THEN 1 ELSE 0 END AS has_own_login,
        s.user_id AS student_user_id
      FROM parent_students ps
      INNER JOIN students s ON s.id = ps.student_id
      WHERE ps.parent_id = ?
        AND s.user_id = ?
      LIMIT 1
      `,
    [parentId, studentUserId]
  );
  return linkRows?.[0] || null;
}

export async function findStudentUserById(pool, studentUserId) {
  const [rows] = await pool.query(
    "SELECT id, full_name, email, role, is_active FROM users WHERE id = ? LIMIT 1",
    [studentUserId]
  );
  return rows?.[0] || null;
}

export async function findParentUserById(pool, parentUserId) {
  const [rows] = await pool.query(
    `
      SELECT id, role, is_active
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
    [parentUserId]
  );
  return rows?.[0] || null;
}

export async function findParentProfileIdByUserId(pool, parentUserId) {
  const [rows] = await pool.query(
    `
      SELECT id
      FROM parents
      WHERE user_id = ?
      LIMIT 1
      `,
    [parentUserId]
  );
  return rows?.[0]?.id ? Number(rows[0].id) : null;
}

export async function hasParentStudentLink(pool, parentId, studentUserId) {
  const [rows] = await pool.query(
    `
      SELECT 1
      FROM parent_students ps
      INNER JOIN students s ON s.id = ps.student_id
      WHERE ps.parent_id = ?
        AND s.user_id = ?
      LIMIT 1
      `,
    [parentId, studentUserId]
  );
  return rows.length > 0;
}
