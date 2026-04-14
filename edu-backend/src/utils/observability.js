import crypto from "crypto";

function nowIso() {
  return new Date().toISOString();
}

function asErrorShape(err) {
  if (!err) return null;
  return {
    message: err?.message || String(err),
    code: err?.code || null,
    name: err?.name || null,
  };
}

function emit(level, event, details = {}) {
  const payload = {
    ts: nowIso(),
    level,
    event,
    ...details,
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function logInfo(event, details = {}) {
  emit("info", event, details);
}

export function logWarn(event, details = {}) {
  emit("warn", event, details);
}

export function logError(event, details = {}) {
  emit("error", event, details);
}

function normalizeIncomingRequestId(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  return raw.slice(0, 128);
}

export function requestIdMiddleware(req, res, next) {
  const incoming = normalizeIncomingRequestId(req.headers["x-request-id"]);
  const requestId = incoming || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

export function requestScopedLogger(req, _res, next) {
  req.log = {
    info: (event, details = {}) =>
      logInfo(event, { requestId: req.requestId, method: req.method, path: req.path, ...details }),
    warn: (event, details = {}) =>
      logWarn(event, { requestId: req.requestId, method: req.method, path: req.path, ...details }),
    error: (event, details = {}) =>
      logError(event, {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        ...(details.error ? { error: asErrorShape(details.error) } : {}),
        ...details,
      }),
  };
  next();
}

export function errorResponseTraceMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (
      res.statusCode >= 400 &&
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      !Object.prototype.hasOwnProperty.call(body, "requestId")
    ) {
      return originalJson({ ...body, requestId: req.requestId });
    }
    return originalJson(body);
  };
  next();
}

export function toStructuredError(err) {
  return asErrorShape(err);
}
