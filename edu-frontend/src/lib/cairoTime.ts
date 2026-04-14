export const PLATFORM_TZ = "Africa/Cairo";

/**
 * Canonical frontend scheduling time contract:
 * - Backend stores lesson/session datetimes as naive "YYYY-MM-DD HH:MM:SS".
 * - Those strings represent Cairo wall-clock time, not UTC timestamps.
 * - Conversion happens only at the UI boundary through these helpers.
 * - We use Intl time-zone data for Africa/Cairo so parsing/formatting does not
 *   depend on a hardcoded UTC offset.
 */

type CairoParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T])(\d{2}):(\d{2})(?::(\d{2}))?$/;
const TIME_RE = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}

function partsRecord(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function hasExplicitOffset(value: string): boolean {
  return value.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(value);
}

function buildDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseDateKey(value: string): Pick<CairoParts, "year" | "month" | "day"> | null {
  const match = DATE_RE.exec(value.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseNaiveDateTime(value: string): CairoParts | null {
  const match = DATETIME_RE.exec(value.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "0"),
  };
}

function parseTimeOnly(value: string): Pick<CairoParts, "hour" | "minute" | "second"> | null {
  const match = TIME_RE.exec(value.trim());
  if (!match) return null;
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    second: Number(match[3] ?? "0"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = partsRecord(
    getFormatter("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date),
  );

  const utcLike = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );

  return utcLike - date.getTime();
}

function zonedPartsToUtcMs(parts: CairoParts, timeZone: string): number {
  const baseUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  let utcMs = baseUtcMs;
  for (let i = 0; i < 3; i += 1) {
    const offsetMs = getTimeZoneOffsetMs(new Date(utcMs), timeZone);
    const adjustedMs = baseUtcMs - offsetMs;
    if (adjustedMs === utcMs) break;
    utcMs = adjustedMs;
  }

  return utcMs;
}

function formatWallClockTime(value: string, locale: string): string {
  const parts = parseTimeOnly(value);
  if (!parts) return "";
  const date = new Date(Date.UTC(2000, 0, 1, parts.hour, parts.minute, parts.second));
  return getFormatter(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function parseCairoNaive(value: string): Date {
  const normalized = String(value ?? "").trim();
  if (!normalized) return new Date(NaN);
  if (hasExplicitOffset(normalized)) return new Date(normalized);

  const parts = parseNaiveDateTime(normalized);
  if (!parts) return new Date(NaN);

  return new Date(zonedPartsToUtcMs(parts, PLATFORM_TZ));
}

export function getCairoParts(date: Date): CairoParts {
  const parts = partsRecord(
    getFormatter("en-CA", {
      timeZone: PLATFORM_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function cairoDateKey(date: Date): string {
  const { year, month, day } = getCairoParts(date);
  return buildDateKey(year, month, day);
}

export function cairoDateKeyFromValue(value: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  if (!hasExplicitOffset(normalized) && /^\d{4}-\d{2}-\d{2}/.test(normalized)) {
    return normalized.slice(0, 10);
  }
  const date = parseCairoNaive(normalized);
  return Number.isNaN(date.getTime()) ? "" : cairoDateKey(date);
}

export function addDaysToCairoDateKey(dateKey: string, days: number): string {
  const parts = parseDateKey(dateKey);
  if (!parts) return "";
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + days);
  return buildDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function addCairoDays(date: Date, days: number): Date {
  const { year, month, day, hour, minute, second } = getCairoParts(date);
  const nextKey = addDaysToCairoDateKey(buildDateKey(year, month, day), days);
  return parseCairoNaive(`${nextKey} ${pad2(hour)}:${pad2(minute)}:${pad2(second)}`);
}

export function startOfCairoWeekMonday(date: Date): Date {
  const cairoNoon = parseCairoNaive(`${cairoDateKey(date)} 12:00:00`);
  if (Number.isNaN(cairoNoon.getTime())) return new Date(NaN);

  const utcDow = cairoNoon.getUTCDay();
  const diff = utcDow === 0 ? -6 : 1 - utcDow;
  const mondayNoon = addCairoDays(cairoNoon, diff);
  return parseCairoNaive(`${cairoDateKey(mondayNoon)} 00:00:00`);
}

export function cairoWeekdayMon1Sun7FromDateKey(dateKey: string): number | null {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;
  const cairoNoon = parseCairoNaive(`${dateKey} 12:00:00`);
  if (Number.isNaN(cairoNoon.getTime())) return null;
  const utcDow = cairoNoon.getUTCDay();
  return utcDow === 0 ? 7 : utcDow;
}

export function cairoStartOfDay(date: Date): string {
  return `${cairoDateKey(date)} 00:00:00`;
}

export function cairoEndOfDay(date: Date): string {
  return `${cairoDateKey(date)} 23:59:59`;
}

export function formatCairoTimeOnly(
  value: string | null | undefined,
  locale: string,
): string {
  if (!value) return "";
  const normalized = value.trim();
  if (!normalized) return "";

  const rangeMatch = normalized.match(
    /^(\d{2}:\d{2}(?::\d{2})?)-(\d{2}:\d{2}(?::\d{2})?)$/,
  );
  if (rangeMatch) {
    return `${formatWallClockTime(rangeMatch[1], locale)} - ${formatWallClockTime(rangeMatch[2], locale)}`;
  }

  const isDateTime = /^\d{4}-\d{2}-\d{2}/.test(normalized) || normalized.includes("T");
  if (isDateTime || hasExplicitOffset(normalized)) {
    const date = parseCairoNaive(normalized);
    if (Number.isNaN(date.getTime())) return "";
    return getFormatter(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: PLATFORM_TZ,
    }).format(date);
  }

  return formatWallClockTime(normalized, locale);
}

export function formatCairoDayHeader(dateKey: string, locale: string): string {
  const date = parseCairoNaive(`${dateKey} 12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return getFormatter(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: PLATFORM_TZ,
  }).format(date);
}

export function formatCairoDateOnly(value: string | null, locale: string): string {
  if (!value) return "";
  const normalized = String(value).trim();
  if (!normalized) return "";
  const date = parseCairoNaive(normalized);
  if (Number.isNaN(date.getTime())) return "";
  return getFormatter(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: PLATFORM_TZ,
  }).format(date);
}

export function formatCairoDateTime(value: string | null, locale: string): string {
  if (!value) return "";
  const normalized = String(value).trim();
  if (!normalized) return "";
  const date = parseCairoNaive(normalized);
  if (Number.isNaN(date.getTime())) return "";
  return getFormatter(locale, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PLATFORM_TZ,
  }).format(date);
}

export function formatCairoFullDateTime(value: string | null, locale: string): string {
  if (!value) return "";
  const normalized = String(value).trim();
  if (!normalized) return "";
  const date = parseCairoNaive(normalized);
  if (Number.isNaN(date.getTime())) return "";
  return getFormatter(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: PLATFORM_TZ,
  }).format(date).replace(",", "");
}
