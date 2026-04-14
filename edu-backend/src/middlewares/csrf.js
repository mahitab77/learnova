// src/middlewares/csrf.js
// ============================================================================
// Stateless-session CSRF protection (Double-Submit via session storage)
// ----------------------------------------------------------------------------
// Contract:
//   1. Frontend calls GET /auth/csrf-token (authenticated) → receives a token.
//   2. Backend stores the token in req.session.csrfToken.
//   3. On every POST / PUT / PATCH / DELETE for an authenticated session,
//      the frontend MUST send:  X-CSRF-Token: <token>
//   4. requireCsrf() compares the header value to the session value.
//      Mismatch → 403 CSRF_INVALID.
//
// Exempt paths (no session → no CSRF):
//   - GET /auth/csrf-token  (read-only, issues the token)
//   - POST /auth/login, /auth/register-*, /auth/request-reset, /auth/verify-reset
//     → These don't have a session yet, so req.session.user is absent → skipped.
//
// Security note:
//   Storing the token in the session (not a cookie) means a cross-origin attacker
//   cannot read it — that's the protection. This does NOT require a separate cookie.
// ============================================================================

import crypto from "crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Ensures a CSRF token exists in the session and returns it.
 * Call this from the /auth/csrf-token endpoint (or any GET that needs it).
 *
 * @param {import("express").Request} req
 * @returns {string} the CSRF token
 */
export function generateCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  return req.session.csrfToken;
}

/**
 * Global middleware: enforces CSRF token on mutating requests for
 * authenticated sessions.
 *
 * - Safe methods (GET, HEAD, OPTIONS) → always pass.
 * - Unauthenticated sessions (no req.session.user.id) → pass (auth middleware
 *   will reject them; pre-login flows like /auth/login are naturally exempt).
 * - Authenticated + mutating → header X-CSRF-Token must match session token.
 *   Missing session tokens fail closed.
 *
 * @type {import("express").RequestHandler}
 */
export function requireCsrf(req, res, next) {
  // Safe HTTP methods never carry side-effects → always pass
  if (SAFE_METHODS.has(req.method)) return next();

  // No authenticated session → CSRF not applicable here; let auth middleware decide
  if (!req.session?.user?.id) return next();

  // Authenticated mutating requests fail closed when the session token is missing.
  const sessionToken = req.session.csrfToken;
  if (!sessionToken) {
    return res.status(403).json({
      success: false,
      code: "CSRF_SESSION_TOKEN_MISSING",
      message: "CSRF token missing for authenticated session. Refresh and try again.",
    });
  }

  const requestToken = req.headers["x-csrf-token"];

  if (!requestToken || requestToken !== sessionToken) {
    return res.status(403).json({
      success: false,
      code: "CSRF_INVALID",
      message: "Invalid or missing CSRF token.",
    });
  }

  next();
}
