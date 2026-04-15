import crypto from "crypto";
import pool from "../../db.js";

export function hashOtpCode(code) {
  return crypto.createHash("sha256").update(String(code || ""), "utf8").digest("hex");
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function safeRole(role) {
  return String(role || "").toLowerCase();
}

export function isEnabledFlag(value) {
  return value === true || Number(value) === 1;
}

export async function getStudentDirectLoginPolicy(userId) {
  const [rows] = await pool.query(
    `
    SELECT
      s.id AS student_id,
      COUNT(ps.id) AS parent_link_count,
      MAX(CASE WHEN ps.has_own_login = 1 THEN 1 ELSE 0 END) AS direct_login_enabled
    FROM students s
    LEFT JOIN parent_students ps ON ps.student_id = s.id
    WHERE s.user_id = ?
    GROUP BY s.id
    LIMIT 1
    `,
    [userId]
  );

  if (!rows.length) return null;

  return {
    studentId: rows[0].student_id,
    parentLinkCount: Number(rows[0].parent_link_count) || 0,
    directLoginEnabled: isEnabledFlag(rows[0].direct_login_enabled),
  };
}

export function sessionRegenerate(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

export function sessionSave(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

export function sessionDestroy(req) {
  return new Promise((resolve) => {
    req.session.destroy(() => resolve());
  });
}

export async function setLoginSession(req, { id, full_name, email, role, extra = {} }) {
  if (!req.session) return false;

  await sessionRegenerate(req);
  req.session.user = {
    id,
    full_name: full_name || "",
    email: email ?? null,
    role: safeRole(role),
  };
  req.session.meta = { ...extra };
  req.session.authenticatedAt = new Date().toISOString();
  await sessionSave(req);
  return true;
}

export function timingSafeEqualStr(a, b) {
  const aa = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export function validatePassword(password) {
  const p = String(password || "");
  if (p.length < 8) return "Password must be at least 8 characters.";
  return null;
}
