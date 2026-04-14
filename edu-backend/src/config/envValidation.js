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

function isValidSameSite(value) {
  return value === "lax" || value === "strict" || value === "none";
}

function isValidCookieDomain(value) {
  if (isBlank(value)) return true;
  const domain = String(value).trim();
  // Basic safety guard: no protocol/path/port, no localhost in production.
  if (domain.includes("://") || domain.includes("/") || domain.includes(":")) return false;
  if (/localhost|127\.0\.0\.1/i.test(domain)) return false;
  return /^[A-Za-z0-9.-]+$/.test(domain);
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
  const sessionStore = String(process.env.SESSION_STORE || "").toLowerCase();

  if (!secure) {
    fail("SESSION_SECURE must be true in production.");
  }

  if (!isValidSameSite(sameSite)) {
    fail("SESSION_SAMESITE must be one of: lax, strict, none.");
  }

  if (sameSite === "none" && !secure) {
    fail("SESSION_SAMESITE=none requires SESSION_SECURE=true in production.");
  }

  if (sessionStore && sessionStore !== "mysql") {
    fail("SESSION_STORE must be mysql in production.");
  }

  if (!isValidCookieDomain(process.env.COOKIE_DOMAIN)) {
    fail("COOKIE_DOMAIN is invalid for production.");
  }
}
