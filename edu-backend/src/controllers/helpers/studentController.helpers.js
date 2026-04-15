const STUDENT_AVAILABILITY_SCOPE_INCOMPLETE_ERROR =
  "Student academic scope is incomplete. Please complete profile/onboarding before viewing teacher availability.";

export function logStudentControllerError(scope, err) {
  console.error(`[studentController][${scope}]`, err);
}

export function getAuthUserId(req) {
  const v =
    req.session?.user?.id ??
    req.user?.id ??
    req.userId ??
    null;
  return Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null;
}

export function badRequest(res, message, extra) {
  return res.status(400).json({ success: false, message, ...(extra || {}) });
}

export function unauthorized(res, message = "Unauthorized") {
  return res.status(401).json({ success: false, message });
}

export function notFound(res, message = "Not found") {
  return res.status(404).json({ success: false, message });
}

export function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function parsePositiveInt(v) {
  const n = toInt(v);
  return n && n > 0 ? n : null;
}

// Student-owned availability must derive scope from authenticated student row only.
export function buildStudentTeacherAvailabilityRequestContext(query = {}, student = null) {
  const rawGradeLevelId = student?.grade_level_id ?? student?.gradeLevelId;
  const scope = {
    systemId: parsePositiveInt(student?.system_id ?? student?.systemId),
    stageId: parsePositiveInt(student?.stage_id ?? student?.stageId),
    gradeLevelId:
      rawGradeLevelId == null ? null : parsePositiveInt(rawGradeLevelId),
  };

  return {
    teacherId: parsePositiveInt(query?.teacher_id ?? query?.teacherId),
    subjectId: parsePositiveInt(query?.subject_id ?? query?.subjectId),
    from: query?.from,
    to: query?.to,
    scope,
    scopeError:
      !scope.systemId || !scope.stageId
        ? STUDENT_AVAILABILITY_SCOPE_INCOMPLETE_ERROR
        : null,
  };
}

export function handleApiError(res, err, context = "API operation") {
  logStudentControllerError(context, err);

  const sqlMessage = err?.sqlMessage || err?.message || "Database error";
  if (
    err?.sqlState === "45000" ||
    err?.code === "ER_DUP_ENTRY" ||
    String(sqlMessage).toLowerCase().includes("foreign key constraint") ||
    String(sqlMessage).toLowerCase().includes("constraint fails") ||
    String(sqlMessage).toLowerCase().includes("cannot add or update")
  ) {
    return res.status(400).json({
      success: false,
      message: sqlMessage,
      code: err?.code || "VALIDATION_ERROR",
    });
  }

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred. Please try again.",
    code: "INTERNAL_SERVER_ERROR",
  });
}
