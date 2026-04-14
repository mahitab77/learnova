// src/lib/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// CSRF token cache
// ---------------------------------------------------------------------------
// Fetched lazily after login, cached in module scope for the browser session.
// It is cleared on explicit auth boundaries and automatically on auth failures.

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let _csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/csrf-token`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data: unknown = await res.json().catch(() => null);
    if (
      typeof data === "object" &&
      data !== null &&
      "csrfToken" in data &&
      typeof (data as { csrfToken: unknown }).csrfToken === "string"
    ) {
      return (data as { csrfToken: string }).csrfToken;
    }
  } catch {
    // Network error or not logged in — silently ignore
  }
  return null;
}

async function getCsrfToken(): Promise<string | null> {
  if (_csrfToken) return _csrfToken;
  _csrfToken = await fetchCsrfToken();
  return _csrfToken;
}

/** Call this when the user logs out to reset the cached token. */
export function clearCsrfToken(): void {
  _csrfToken = null;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ApiError = {
  status: number;
  code?: string;
  message: string;
  raw?: unknown; // ✅ no "any"
};

export type ApiFetchOptions = RequestInit & {
  json?: JsonValue; // ✅ typed JSON payload (no any)
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // auto JSON
  let body: BodyInit | null | undefined = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  // Attach CSRF token for all state-mutating methods
  const method = (options.method ?? "GET").toUpperCase();
  if (MUTATING_METHODS.has(method)) {
    const csrf = await getCsrfToken();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body,
    credentials: "include", // ✅ REQUIRED for your backend sessions
  });

  const contentType = res.headers.get("content-type") || "";

  let data: unknown = null;
  if (contentType.includes("application/json")) {
    // Keep it safe: response may be empty or invalid JSON
    data = await res.json().catch(() => ({}));
  }

  if (!res.ok) {
    // If auth/session context is invalid or changed, drop cached CSRF immediately.
    if (res.status === 401 || res.status === 403) {
      clearCsrfToken();
    }

    const code = isRecord(data) ? (typeof data.code === "string" ? data.code : undefined) : undefined;
    const message =
      isRecord(data) && typeof data.message === "string"
        ? data.message
        : `Request failed (${res.status})`;

    const err: ApiError = {
      status: res.status,
      code,
      message,
      raw: data,
    };

    throw err;
  }

  // If API sometimes returns empty body on success, you can special-case here.
  return data as T;
}
