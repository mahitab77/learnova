import { isValidDateTimeStr, toSqlDateTime } from "../utils/cairoTime.js";

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toBoolTinyInt(value) {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return null;
}

function trimStringOrNull(value) {
  return typeof value === "string" ? value.trim() : null;
}

export function buildCreateHomeworkPayload(body) {
  const subjectId = toInt(body?.subject_id);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = trimStringOrNull(body?.description);
  const dueAt = body?.due_at;
  const maxScore = body?.max_score == null ? null : toInt(body?.max_score);
  const attachmentsUrl = trimStringOrNull(body?.attachments_url);
  const isActive = toBoolTinyInt(body?.is_active) ?? 1;

  if (!subjectId || subjectId <= 0) return { ok: false, message: "subject_id is required" };
  if (!title) return { ok: false, message: "title is required" };
  if (!dueAt || !isValidDateTimeStr(dueAt)) {
    return { ok: false, message: "due_at must be a datetime string" };
  }
  if (maxScore != null && maxScore <= 0) {
    return { ok: false, message: "max_score must be positive if provided" };
  }

  return {
    ok: true,
    payload: {
      subjectId,
      title,
      description,
      dueAtSql: toSqlDateTime(dueAt),
      maxScore,
      attachmentsUrl,
      isActive,
    },
  };
}

export function buildUpdateHomeworkPayload(body, current) {
  const subjectId = body?.subject_id == null ? current.subject_id : toInt(body.subject_id);
  const title = body?.title == null ? current.title : String(body.title).trim();
  const description =
    body?.description === undefined
      ? current.description
      : typeof body.description === "string"
      ? body.description.trim()
      : null;
  const dueAt = body?.due_at == null ? current.due_at : body.due_at;
  const maxScore =
    body?.max_score === undefined
      ? current.max_score
      : body.max_score == null
      ? null
      : toInt(body.max_score);
  const attachmentsUrl =
    body?.attachments_url === undefined
      ? current.attachments_url
      : typeof body.attachments_url === "string"
      ? body.attachments_url.trim()
      : null;
  const isActive =
    body?.is_active == null ? current.is_active : toBoolTinyInt(body.is_active) ?? current.is_active;

  if (!subjectId || subjectId <= 0) return { ok: false, message: "subject_id must be positive" };
  if (!title) return { ok: false, message: "title cannot be empty" };
  if (!dueAt || !isValidDateTimeStr(dueAt)) {
    return { ok: false, message: "due_at must be a datetime string" };
  }
  if (maxScore != null && maxScore <= 0) {
    return { ok: false, message: "max_score must be positive if provided" };
  }

  return {
    ok: true,
    payload: {
      subjectId,
      title,
      description,
      dueAtSql: toSqlDateTime(dueAt),
      maxScore,
      attachmentsUrl,
      isActive,
    },
  };
}

export function buildCreateQuizPayload(body) {
  const subjectId = toInt(body?.subject_id);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = trimStringOrNull(body?.description);
  const availableFrom = body?.available_from;
  const availableUntil = body?.available_until;
  const timeLimitMin = body?.time_limit_min == null ? null : toInt(body?.time_limit_min);
  const maxScore = body?.max_score == null ? null : toInt(body?.max_score);
  const isActive = toBoolTinyInt(body?.is_active) ?? 1;

  if (!subjectId || subjectId <= 0) return { ok: false, message: "subject_id is required" };
  if (!title) return { ok: false, message: "title is required" };
  if (!availableFrom || !isValidDateTimeStr(availableFrom)) {
    return { ok: false, message: "available_from must be a datetime string" };
  }
  if (!availableUntil || !isValidDateTimeStr(availableUntil)) {
    return { ok: false, message: "available_until must be a datetime string" };
  }

  const fromSql = toSqlDateTime(availableFrom);
  const untilSql = toSqlDateTime(availableUntil);
  if (!fromSql || !untilSql) {
    return { ok: false, message: "available_from/available_until datetime format invalid" };
  }
  if (fromSql >= untilSql) {
    return { ok: false, message: "available_from must be before available_until" };
  }
  if (timeLimitMin != null && timeLimitMin <= 0) {
    return { ok: false, message: "time_limit_min must be positive if provided" };
  }
  if (maxScore != null && maxScore <= 0) {
    return { ok: false, message: "max_score must be positive if provided" };
  }

  return {
    ok: true,
    payload: {
      subjectId,
      title,
      description,
      availableFromSql: fromSql,
      availableUntilSql: untilSql,
      timeLimitMin,
      maxScore,
      isActive,
    },
  };
}

export function buildUpdateQuizPayload(body, current) {
  const subjectId = body?.subject_id == null ? current.subject_id : toInt(body.subject_id);
  const title = body?.title == null ? current.title : String(body.title).trim();
  const description =
    body?.description === undefined
      ? current.description
      : typeof body.description === "string"
      ? body.description.trim()
      : null;
  const availableFrom = body?.available_from == null ? current.available_from : body.available_from;
  const availableUntil =
    body?.available_until == null ? current.available_until : body.available_until;
  const timeLimitMin =
    body?.time_limit_min === undefined
      ? current.time_limit_min
      : body.time_limit_min == null
      ? null
      : toInt(body.time_limit_min);
  const maxScore =
    body?.max_score === undefined
      ? current.max_score
      : body.max_score == null
      ? null
      : toInt(body.max_score);
  const isActive =
    body?.is_active == null ? current.is_active : toBoolTinyInt(body.is_active) ?? current.is_active;

  if (!subjectId || subjectId <= 0) return { ok: false, message: "subject_id must be positive" };
  if (!title) return { ok: false, message: "title cannot be empty" };
  if (!availableFrom || !isValidDateTimeStr(availableFrom)) {
    return { ok: false, message: "available_from must be a datetime string" };
  }
  if (!availableUntil || !isValidDateTimeStr(availableUntil)) {
    return { ok: false, message: "available_until must be a datetime string" };
  }

  const fromSql = toSqlDateTime(availableFrom);
  const untilSql = toSqlDateTime(availableUntil);
  if (!fromSql || !untilSql) {
    return { ok: false, message: "available_from/available_until datetime format invalid" };
  }
  if (fromSql >= untilSql) {
    return { ok: false, message: "available_from must be before available_until" };
  }
  if (timeLimitMin != null && timeLimitMin <= 0) {
    return { ok: false, message: "time_limit_min must be positive if provided" };
  }
  if (maxScore != null && maxScore <= 0) {
    return { ok: false, message: "max_score must be positive if provided" };
  }

  return {
    ok: true,
    payload: {
      subjectId,
      title,
      description,
      availableFromSql: fromSql,
      availableUntilSql: untilSql,
      timeLimitMin,
      maxScore,
      isActive,
    },
  };
}
