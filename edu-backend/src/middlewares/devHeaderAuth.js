import pool from "../db.js";

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

const DEV_HEADER_ENABLED =
  !isProd && String(process.env.ENABLE_DEV_HEADER_AUTH || "false") === "true";

/**
 * Optional development-only auth fallback:
 * - Enabled only when ENABLE_DEV_HEADER_AUTH=true and not production.
 * - Reads x-user-id and attaches req.user with the same shape as session auth.
 *
 * Returns true when it handled the request (either success->next() or response sent),
 * false when dev header mode is disabled and caller should continue its own handling.
 */
export async function handleDevHeaderAuth(req, res, next, { attachUser, validateUserActive }) {
  if (!DEV_HEADER_ENABLED) return false;

  const rawId = req.header("x-user-id");
  if (!rawId) {
    res.status(401).json({
      success: false,
      source: "auth.requireUser",
      code: "AUTH_MISSING",
      message: "Authentication failed: no active session was found.",
      description:
        "Please log in again so a valid session cookie is created. " +
        "In local DEV only, you may also send an 'x-user-id' header.",
    });
    return true;
  }

  const trimmed = String(rawId).trim();
  const userId = Number(trimmed);

  if (!trimmed || !Number.isFinite(userId) || userId <= 0) {
    res.status(400).json({
      success: false,
      source: "auth.requireUser",
      code: "AUTH_HEADER_INVALID",
      message: "Invalid 'x-user-id' header value.",
      description:
        "The 'x-user-id' header must contain a positive numeric user id (e.g. '13'). " +
        `Received: '${rawId}'.`,
    });
    return true;
  }

  const [rows] = await pool.query(
    "SELECT id, full_name, email, role, is_active FROM users WHERE id = ? LIMIT 1",
    [userId]
  );

  if (!rows.length) {
    res.status(401).json({
      success: false,
      source: "auth.requireUser",
      code: "AUTH_USER_NOT_FOUND",
      message: "Authentication failed: user not found for the provided dev id.",
    });
    return true;
  }

  const dbUser = rows[0];
  const userRole = typeof dbUser.role === "string" ? dbUser.role.toLowerCase() : "";
  const validation = await validateUserActive(userId, userRole);
  if (!validation.ok) {
    res.status(validation.status).json({
      ...validation.payload,
      source: "auth.requireUser",
    });
    return true;
  }

  attachUser(req, dbUser);
  next();
  return true;
}

