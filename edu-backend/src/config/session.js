// src/config/session.js
// ============================================================================
// Centralized session cookie configuration
// ----------------------------------------------------------------------------
// Why this exists:
// - Single source of truth for cookie NAME + cookie OPTIONS
// - Used by BOTH:
//   1) express-session middleware (to set the cookie)
//   2) auth.logout controller (to clear the cookie correctly)
//
// IMPORTANT:
// - For logout to reliably clear the cookie, SESSION_COOKIE_OPTIONS must match
//   the cookie options used by express-session (path, domain, sameSite, secure).
// ============================================================================

import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";

const isProd = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Production guard: SESSION_SECRET must be set and must not be the dev default.
// ---------------------------------------------------------------------------
const _rawSecret = process.env.SESSION_SECRET;
const _devFallback = "dev-secret-change-me";

if (isProd && (!_rawSecret || _rawSecret === _devFallback)) {
  // Hard stop — running in prod with a guessable or missing secret is a
  // critical security vulnerability (session forgery).
  console.error(
    "[session] FATAL: SESSION_SECRET is missing or still uses the dev fallback " +
    "in a production environment. Set a strong random value " +
    "(e.g. `openssl rand -hex 64`) and restart."
  );
  process.exit(1);
}

/**
 * Cookie name for express-session and logout clearCookie().
 * Keep this identical everywhere.
 */
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "edu.sid";

/**
 * Cookie options for res.clearCookie(name, options).
 * These MUST match cookie settings used by express-session.
 *
 * NOTE:
 * - httpOnly is always true for session cookies (security).
 * - sameSite + secure must be compatible:
 *   - If sameSite="none" => secure MUST be true (browser requirement).
 * - domain should be set ONLY if you're using a real domain like ".example.com".
 *   For localhost, do NOT set domain.
 */
export const SESSION_COOKIE_OPTIONS = {
  path: "/", // must match
  httpOnly: true,

  // If you're serving frontend + backend on different sites and need cookies cross-site:
  // sameSite must be "none" and secure must be true (HTTPS).
  sameSite: process.env.SESSION_SAMESITE
    ? process.env.SESSION_SAMESITE // "lax" | "strict" | "none"
    : isProd
    ? "lax"
    : "lax",

  secure:
    process.env.SESSION_SECURE != null
      ? process.env.SESSION_SECURE === "true"
      : isProd, // in prod you usually want true (HTTPS)

  // Optional: set this ONLY when using a real domain
  // Example: ".learnova.com" (leading dot allows subdomains)
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),

  // Optional maxAge (ms). If omitted, cookie becomes a "session cookie" in browser.
  ...(process.env.SESSION_MAX_AGE_MS
    ? { maxAge: Number(process.env.SESSION_MAX_AGE_MS) }
    : {}),
};

/**
 * Express-session middleware configuration object (recommended export)
 * Use this in your server/app session setup.
 *
 * Example usage:
 *   import session from "express-session";
 *   import { SESSION_CONFIG } from "./config/session.js";
 *   app.use(session(SESSION_CONFIG));
 */
export const SESSION_CONFIG = {
  name: SESSION_COOKIE_NAME,
  secret: _rawSecret || _devFallback,

  resave: false,
  saveUninitialized: false,

  cookie: SESSION_COOKIE_OPTIONS,

  // Recommended defaults:
  rolling: false, // set true if you want activity to refresh expiry window
  proxy: isProd,  // if behind a reverse proxy (nginx), helps with secure cookies

};

const MySQLStore = MySQLStoreFactory(session);
const SESSION_STORE = String(
  process.env.SESSION_STORE || (isProd ? "mysql" : "memory")
).toLowerCase();

if (isProd && SESSION_STORE === "memory") {
  console.error(
    "[session] FATAL: SESSION_STORE=memory is not allowed in production. " +
      "Use a durable shared store (SESSION_STORE=mysql) and restart."
  );
  process.exit(1);
}

if (SESSION_STORE === "mysql") {
  const dbPort = Number(process.env.DB_PORT || 3306);
  if (!Number.isFinite(dbPort) || dbPort <= 0) {
    console.error(
      "[session] FATAL: DB_PORT must be a valid positive integer when SESSION_STORE=mysql."
    );
    process.exit(1);
  }

  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "root";
  const database = process.env.DB_NAME || "edu_platform";
  const tableName = process.env.SESSION_STORE_TABLE || "session_store";

  if (!host || !user || !database) {
    console.error(
      "[session] FATAL: DB_HOST, DB_USER, and DB_NAME are required when SESSION_STORE=mysql."
    );
    process.exit(1);
  }

  SESSION_CONFIG.store = new MySQLStore({
    host,
    port: dbPort,
    user,
    password: process.env.DB_PASSWORD || "",
    database,
    createDatabaseTable: true,
    schema: {
      tableName,
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data",
      },
    },
  });
}
