// src/db.js
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { logError, logInfo } from "./utils/observability.js";

dotenv.config();

/**
 * Safe integer parser with fallback.
 */
function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Small sleep helper for startup retries.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Centralized DB config.
 * Keep this aligned with `.env`.
 */
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: toInt(process.env.DB_PORT, 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "edu_platform",

  // Pool settings
  waitForConnections: true,
  connectionLimit: toInt(process.env.DB_POOL_CONNECTION_LIMIT, 10),
  queueLimit: 0,

  // Connection behavior
  connectTimeout: toInt(process.env.DB_CONNECT_TIMEOUT_MS, 10000),

  // Good default charset for multilingual content
  charset: "utf8mb4",
};

/**
 * Reusable MySQL connection pool.
 */
const pool = mysql.createPool(dbConfig);

/**
 * Format DB errors so startup logs are actually useful.
 */
function formatDbError(err) {
  return {
    message: err?.message || "Unknown MySQL error",
    code: err?.code || null,
    errno: err?.errno || null,
    sqlState: err?.sqlState || null,
    sqlMessage: err?.sqlMessage || null,
  };
}

/**
 * Test DB connection at startup.
 *
 * Why retries:
 * - Your dev script starts MySQL in the background
 * - XAMPP MySQL may need a few seconds before accepting connections
 *
 * Behavior:
 * - retries a few times
 * - logs full error details
 * - throws if connection still fails, so the app does not pretend it is healthy
 */
export async function testDbConnection(options = {}) {
  const retries = toInt(
    options.retries ?? process.env.DB_CONNECT_RETRIES,
    10
  );
  const retryDelayMs = toInt(
    options.retryDelayMs ?? process.env.DB_RETRY_DELAY_MS,
    2000
  );

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.ping();

      const [rows] = await connection.query(
        "SELECT DATABASE() AS db, @@port AS port, 1 AS result"
      );

      logInfo("db.connection_ok", {
        db: rows[0].db,
        port: rows[0].port,
        result: rows[0].result,
      });

      return true;
    } catch (err) {
      lastError = err;
      const details = formatDbError(err);

      logError("db.connection_failed", {
        attempt,
        retries,
        error: details,
      });

      if (attempt < retries) {
        logInfo("db.retry_scheduled", { retryDelayMs, nextAttempt: attempt + 1 });
        await delay(retryDelayMs);
      }
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  logError("db.connection_exhausted", { retries });
  throw lastError;
}

/**
 * Optional helper for graceful shutdown.
 */
export async function closeDbPool() {
  await pool.end();
}

/**
 * Lightweight readiness probe for request-time health checks.
 * Uses a single short ping/query without startup retry loops.
 */
export async function checkDbReadiness() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    await connection.query("SELECT 1 AS ok");
    return true;
  } catch {
    return false;
  } finally {
    if (connection) connection.release();
  }
}

export default pool;