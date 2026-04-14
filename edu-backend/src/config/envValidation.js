function isBlank(value) {
  return value == null || String(value).trim() === "";
}

function fail(message) {
  console.error(`[env] FATAL: ${message}`);
  process.exit(1);
}

function parseOrigins(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;

  if (isBlank(process.env.SESSION_SECRET)) {
    fail("SESSION_SECRET is required in production.");
  }

  if (isBlank(process.env.DB_HOST) || isBlank(process.env.DB_USER) || isBlank(process.env.DB_NAME)) {
    fail("DB_HOST, DB_USER, and DB_NAME are required in production.");
  }

  if (
    isBlank(process.env.EMAIL_HOST) ||
    isBlank(process.env.EMAIL_PORT) ||
    isBlank(process.env.EMAIL_USER) ||
    isBlank(process.env.EMAIL_PASS)
  ) {
    fail("EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS are required in production.");
  }

  if (isBlank(process.env.FRONTEND_ORIGINS)) {
    fail("FRONTEND_ORIGINS is required in production.");
  }

  const origins = parseOrigins(process.env.FRONTEND_ORIGINS);
  if (!origins.length) {
    fail("FRONTEND_ORIGINS must contain at least one origin in production.");
  }

  if (origins.some((origin) => /localhost|127\.0\.0\.1/i.test(origin))) {
    fail("FRONTEND_ORIGINS cannot include localhost/127.0.0.1 in production.");
  }

  const sameSite = String(process.env.SESSION_SAMESITE || "lax").toLowerCase();
  const secure = String(process.env.SESSION_SECURE || "").toLowerCase() === "true";

  if (!secure) {
    fail("SESSION_SECURE must be true in production.");
  }

  if (sameSite === "none" && !secure) {
    fail("SESSION_SAMESITE=none requires SESSION_SECURE=true in production.");
  }
}
