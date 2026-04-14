function toInt(value) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : null;
}

function isValidTimeString(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(value.trim());
}

function normalizeNullableInt(value) {
  if (value == null || value === "") return null;
  return toInt(value);
}

export function normalizeWeekdayTo1to7(input) {
  const weekday = toInt(input);
  if (weekday == null) return null;
  if (weekday === 0) return 7;
  if (weekday >= 1 && weekday <= 7) return weekday;
  return null;
}

export function normalizeTimeToHHMMSS(input) {
  if (!isValidTimeString(input)) return null;
  const trimmed = input.trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

export function normalizeBooleanTinyInt(input, defaultValue) {
  if (input === true || input === 1 || input === "1") return 1;
  if (input === false || input === 0 || input === "0") return 0;
  if (defaultValue !== undefined) return normalizeBooleanTinyInt(defaultValue);
  return null;
}

export const normalizeBoolTinyInt = normalizeBooleanTinyInt;

export function normalizeIncomingScheduleRow(row) {
  return {
    weekday: normalizeWeekdayTo1to7(row?.weekday),
    start_time: normalizeTimeToHHMMSS(row?.start_time ?? row?.startTime),
    end_time: normalizeTimeToHHMMSS(row?.end_time ?? row?.endTime),
    is_group: normalizeBooleanTinyInt(row?.is_group ?? row?.isGroup, 0),
    max_students: normalizeNullableInt(row?.max_students ?? row?.maxStudents),
    is_active: normalizeBooleanTinyInt(row?.is_active ?? row?.isActive, 1),
  };
}
