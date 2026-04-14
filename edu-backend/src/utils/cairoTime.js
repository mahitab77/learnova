export const PLATFORM_TZ = "Africa/Cairo";

/**
 * Canonical backend scheduling time contract:
 * - MariaDB stores lesson/session datetimes as naive "YYYY-MM-DD HH:MM:SS".
 * - Learnova currently treats those values as Cairo wall-clock time.
 * - These helpers only validate and normalize transport strings; they do not
 *   convert storage to UTC or reinterpret existing rows.
 * - Any query that compares against NOW()/CURDATE() must run with a DB session
 *   timezone that matches this Cairo-local wall-clock contract.
 */

export function isValidDateStr(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidDateTimeStr(value) {
  if (typeof value !== "string") return false;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return true;
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value);
}

export function toSqlDateTime(value) {
  if (typeof value !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value.replace("T", " ") + ":00";
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.replace("T", " ");
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  return null;
}
