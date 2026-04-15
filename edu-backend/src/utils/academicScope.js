import pool from "../db.js";

function toPositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj ?? {}, key);
}

function normalizeResolvedScopeForMatching(systemId, stageId, gradeLevelId) {
  return {
    systemId: toPositiveInt(systemId),
    stageId: toPositiveInt(stageId),
    gradeLevelId: gradeLevelId == null ? null : toPositiveInt(gradeLevelId),
  };
}

function readScopeValue(row, snakeKey, camelKey) {
  if (!row || typeof row !== "object") return null;

  if (hasOwn(row, snakeKey)) return row[snakeKey];
  if (camelKey && hasOwn(row, camelKey)) return row[camelKey];
  return null;
}

export class AcademicScopeValidationError extends Error {
  constructor(message, code = "INVALID_ACADEMIC_SCOPE", details = {}) {
    super(message);
    this.name = "AcademicScopeValidationError";
    this.code = code;
    this.status = 400;
    this.details = details;
  }
}

async function findStudentScopeRowById(studentId, executor = pool) {
  const normalizedStudentId = toPositiveInt(studentId);
  if (!normalizedStudentId) return null;

  const [rows] = await executor.query(
    `
    SELECT
      id,
      system_id,
      stage_id,
      grade_level_id
    FROM students
    WHERE id = ?
    LIMIT 1
    `,
    [normalizedStudentId]
  );

  return rows.length ? rows[0] : null;
}

async function loadStudentScopeRow(studentOrId, executor = pool) {
  const studentId = toPositiveInt(studentOrId);
  if (studentId) {
    return findStudentScopeRowById(studentId, executor);
  }

  if (!studentOrId || typeof studentOrId !== "object") {
    return null;
  }

  const hasScopeColumns =
    hasOwn(studentOrId, "system_id") ||
    hasOwn(studentOrId, "stage_id") ||
    hasOwn(studentOrId, "grade_level_id");

  if (hasScopeColumns) {
    return studentOrId;
  }

  const embeddedStudentId = toPositiveInt(studentOrId.id ?? studentOrId.student_id);
  if (!embeddedStudentId) {
    return null;
  }

  return findStudentScopeRowById(embeddedStudentId, executor);
}

async function deriveSystemIdFromStage(stageId, executor = pool) {
  const normalizedStageId = toPositiveInt(stageId);
  if (!normalizedStageId) return null;

  const [rows] = await executor.query(
    `
    SELECT system_id
    FROM grade_stages
    WHERE id = ?
    LIMIT 1
    `,
    [normalizedStageId]
  );

  return rows.length ? toPositiveInt(rows[0].system_id) : null;
}

async function resolveNormalizedAcademicIds(student, executor = pool) {
  let systemId = toPositiveInt(student?.system_id);
  let stageId = toPositiveInt(student?.stage_id);
  let gradeLevelId =
    student?.grade_level_id == null ? null : toPositiveInt(student.grade_level_id);

  const hasNormalizedValues =
    systemId !== null || stageId !== null || gradeLevelId !== null;

  // If only grade_level_id or stage_id is populated, derive the missing
  // normalized parents from catalog tables.
  if (gradeLevelId && !stageId) {
    const [rows] = await executor.query(
      `
      SELECT gl.stage_id, gs.system_id
      FROM grade_levels gl
      INNER JOIN grade_stages gs ON gs.id = gl.stage_id
      WHERE gl.id = ?
      LIMIT 1
      `,
      [gradeLevelId]
    );

    if (rows.length) {
      stageId = toPositiveInt(rows[0].stage_id) ?? stageId;
      systemId = toPositiveInt(rows[0].system_id) ?? systemId;
    }
  }

  if (stageId && !systemId) {
    systemId = await deriveSystemIdFromStage(stageId, executor);
  }

  return {
    systemId,
    stageId,
    gradeLevelId,
    hasNormalizedValues,
  };
}

/**
 * Compatibility mapper for legacy student-scope inputs.
 *
 * Use this only on writes or migration helpers when callers still submit
 * grade_stage / grade_number. Operational discovery, selection, and booking
 * must resolve student scope from normalized students fields only.
 */
export async function resolveCatalogAcademicIdsFromLegacyScope(
  { gradeStage, gradeNumber } = {},
  executor = pool
) {
  const stageKey = typeof gradeStage === "string" ? gradeStage.trim() : "";
  const normalizedGradeNumber = toPositiveInt(gradeNumber);

  let stageRow = null;

  if (stageKey) {
    const [stageRows] = await executor.query(
      `
      SELECT id, system_id, code, name_en, name_ar
      FROM grade_stages
      WHERE LOWER(code) = LOWER(?)
         OR LOWER(name_en) = LOWER(?)
         OR LOWER(name_ar) = LOWER(?)
      LIMIT 1
      `,
      [stageKey, stageKey, stageKey]
    );

    if (stageRows.length) {
      stageRow = stageRows[0];
    }
  }

  if (!stageRow) {
    return { systemId: null, stageId: null, gradeLevelId: null };
  }

  let gradeLevelId = null;

  if (normalizedGradeNumber !== null) {
    const codeCandidates = [
      String(normalizedGradeNumber),
      `G${normalizedGradeNumber}`,
      `g${normalizedGradeNumber}`,
      `grade_${normalizedGradeNumber}`,
      `Grade${normalizedGradeNumber}`,
      `GR${normalizedGradeNumber}`,
    ];

    const [levelRows] = await executor.query(
      `
      SELECT id
      FROM grade_levels
      WHERE stage_id = ?
        AND (
          sort_order = ?
          OR code IN (?,?,?,?,?,?)
          OR code LIKE ?
          OR name_en LIKE ?
          OR name_ar LIKE ?
        )
      ORDER BY sort_order ASC, id ASC
      LIMIT 1
      `,
      [
        stageRow.id,
        normalizedGradeNumber,
        ...codeCandidates,
        `%${normalizedGradeNumber}%`,
        `%${normalizedGradeNumber}%`,
        `%${normalizedGradeNumber}%`,
      ]
    );

    if (levelRows.length) {
      gradeLevelId = levelRows[0].id;
    }
  }

  return {
    systemId: stageRow.system_id,
    stageId: stageRow.id,
    gradeLevelId,
  };
}

export async function validateCatalogAcademicScope(
  scope = {},
  executor = pool,
  { requireSystemStage = false } = {}
) {
  const { systemId, stageId, gradeLevelId } = scope;
  const normalizedSystemId = systemId == null ? null : toPositiveInt(systemId);
  const normalizedStageId = stageId == null ? null : toPositiveInt(stageId);
  const gradeLevelProvided = hasOwn(scope, "gradeLevelId") && gradeLevelId != null;
  const normalizedGradeLevelId = gradeLevelProvided
    ? toPositiveInt(gradeLevelId)
    : null;

  if (systemId != null && !normalizedSystemId) {
    throw new AcademicScopeValidationError(
      "systemId must be a positive integer.",
      "INVALID_SYSTEM_ID"
    );
  }

  if (stageId != null && !normalizedStageId) {
    throw new AcademicScopeValidationError(
      "stageId must be a positive integer.",
      "INVALID_STAGE_ID"
    );
  }

  if (gradeLevelProvided && !normalizedGradeLevelId) {
    throw new AcademicScopeValidationError(
      "gradeLevelId must be a positive integer or null.",
      "INVALID_GRADE_LEVEL_ID"
    );
  }

  const hasAnyScopeValue =
    normalizedSystemId !== null ||
    normalizedStageId !== null ||
    normalizedGradeLevelId !== null;

  if (!hasAnyScopeValue) {
    if (requireSystemStage) {
      throw new AcademicScopeValidationError(
        "systemId and stageId are required.",
        "ACADEMIC_SCOPE_REQUIRED"
      );
    }

    return {
      systemId: null,
      stageId: null,
      gradeLevelId: null,
    };
  }

  if (!normalizedSystemId || !normalizedStageId) {
    throw new AcademicScopeValidationError(
      "systemId and stageId are required together.",
      "ACADEMIC_SCOPE_REQUIRED"
    );
  }

  const [[systemRow]] = await executor.query(
    `
    SELECT id
    FROM educational_systems
    WHERE id = ?
    LIMIT 1
    `,
    [normalizedSystemId]
  );

  if (!systemRow) {
    throw new AcademicScopeValidationError(
      "Invalid systemId.",
      "INVALID_SYSTEM_ID"
    );
  }

  const [[stageRow]] = await executor.query(
    `
    SELECT id, system_id
    FROM grade_stages
    WHERE id = ?
    LIMIT 1
    `,
    [normalizedStageId]
  );

  if (!stageRow) {
    throw new AcademicScopeValidationError(
      "Invalid stageId.",
      "INVALID_STAGE_ID"
    );
  }

  if (toPositiveInt(stageRow.system_id) !== normalizedSystemId) {
    throw new AcademicScopeValidationError(
      "stageId does not belong to the given systemId.",
      "INVALID_STAGE_SYSTEM_COMBINATION"
    );
  }

  if (normalizedGradeLevelId !== null) {
    const [[levelRow]] = await executor.query(
      `
      SELECT id, stage_id
      FROM grade_levels
      WHERE id = ?
      LIMIT 1
      `,
      [normalizedGradeLevelId]
    );

    if (!levelRow) {
      throw new AcademicScopeValidationError(
        "Invalid gradeLevelId.",
        "INVALID_GRADE_LEVEL_ID"
      );
    }

    if (toPositiveInt(levelRow.stage_id) !== normalizedStageId) {
      throw new AcademicScopeValidationError(
        "gradeLevelId does not belong to the given stageId.",
        "INVALID_GRADE_LEVEL_STAGE_COMBINATION"
      );
    }
  }

  return {
    systemId: normalizedSystemId,
    stageId: normalizedStageId,
    gradeLevelId: normalizedGradeLevelId,
  };
}

export async function normalizeRegistrationAcademicScope(
  scopeInput = {},
  executor = pool,
  { requireSystemStage = false, allowLegacyFallback = false } = {}
) {
  // Canonical registration/write path: callers must provide normalized ids.
  // Legacy gradeStage/gradeNumber fallback is migration-only and disabled by
  // default. Controllers/services must opt in explicitly via allowLegacyFallback.
  const hasCanonicalInput =
    hasOwn(scopeInput, "systemId") ||
    hasOwn(scopeInput, "stageId") ||
    hasOwn(scopeInput, "gradeLevelId");

  if (hasCanonicalInput) {
    const validated = await validateCatalogAcademicScope(
      {
        systemId: scopeInput.systemId,
        stageId: scopeInput.stageId,
        gradeLevelId: scopeInput.gradeLevelId,
      },
      executor,
      { requireSystemStage }
    );

    return {
      ...validated,
      source: "canonical",
      usedLegacyFallback: false,
      legacyScope: {
        gradeStage: null,
        gradeNumber: null,
      },
    };
  }

  const legacyScope = {
    gradeStage:
      typeof scopeInput?.gradeStage === "string" && scopeInput.gradeStage.trim()
        ? scopeInput.gradeStage.trim()
        : null,
    gradeNumber:
      scopeInput?.gradeNumber == null ? null : toPositiveInt(scopeInput.gradeNumber),
  };

  const hasLegacyInput =
    legacyScope.gradeStage !== null || scopeInput?.gradeNumber != null;

  if (!hasLegacyInput) {
    if (requireSystemStage) {
      throw new AcademicScopeValidationError(
        "systemId and stageId are required.",
        "ACADEMIC_SCOPE_REQUIRED"
      );
    }

    return {
      systemId: null,
      stageId: null,
      gradeLevelId: null,
      source: "missing",
      usedLegacyFallback: false,
      legacyScope: {
        gradeStage: null,
        gradeNumber: null,
      },
    };
  }

  if (!allowLegacyFallback) {
    throw new AcademicScopeValidationError(
      "Legacy gradeStage/gradeNumber scope is no longer accepted. Provide systemId/stageId/gradeLevelId.",
      "LEGACY_ACADEMIC_SCOPE_NOT_SUPPORTED",
      { legacyScope }
    );
  }

  const resolvedLegacy = await resolveCatalogAcademicIdsFromLegacyScope(
    {
      gradeStage: legacyScope.gradeStage,
      gradeNumber: legacyScope.gradeNumber,
    },
    executor
  );

  if (!resolvedLegacy.systemId || !resolvedLegacy.stageId) {
    throw new AcademicScopeValidationError(
      "Provide a valid academic scope using systemId/stageId or a supported legacy gradeStage/gradeNumber pair.",
      "INVALID_ACADEMIC_SCOPE"
    );
  }

  const validated = await validateCatalogAcademicScope(
    resolvedLegacy,
    executor,
    { requireSystemStage }
  );

  return {
    ...validated,
    source: "legacy",
    usedLegacyFallback: true,
    legacyScope,
  };
}

/**
 * Resolve a student's canonical academic scope from a row or student id.
 *
 * Operational student scope is resolved from normalized students fields only.
 * Parent/student discovery, selection, and booking must not fall back to
 * legacy grade_stage / grade_number at runtime.
 */
export async function resolveStudentAcademicIds(studentOrId, executor = pool) {
  const student = await loadStudentScopeRow(studentOrId, executor);
  if (!student) {
    return {
      systemId: null,
      stageId: null,
      gradeLevelId: null,
      source: "missing",
    };
  }

  const normalized = await resolveNormalizedAcademicIds(student, executor);

  return {
    systemId: normalized.systemId ?? null,
    stageId: normalized.stageId ?? null,
    gradeLevelId: normalized.gradeLevelId ?? null,
    source: normalized.hasNormalizedValues ? "normalized" : "missing",
  };
}

/**
 * student grade_level_id = null means stage-wide only, not wildcard over all grades.
 * Exact-grade students match their exact grade rows plus stage-wide (NULL) rows.
 */
export function academicScopeMatchesRow(
  scope,
  row,
  {
    systemKey = "system_id",
    stageKey = "stage_id",
    gradeLevelKey = "grade_level_id",
    systemKeyCamel = "systemId",
    stageKeyCamel = "stageId",
    gradeLevelKeyCamel = "gradeLevelId",
  } = {}
) {
  const normalizedScope = normalizeResolvedScopeForMatching(
    scope?.systemId,
    scope?.stageId,
    scope?.gradeLevelId
  );

  if (!normalizedScope.systemId || !normalizedScope.stageId) {
    return false;
  }

  const rowSystemId = toPositiveInt(readScopeValue(row, systemKey, systemKeyCamel));
  const rowStageId = toPositiveInt(readScopeValue(row, stageKey, stageKeyCamel));
  const rawRowGradeLevelId = readScopeValue(
    row,
    gradeLevelKey,
    gradeLevelKeyCamel
  );
  const rowGradeLevelId =
    rawRowGradeLevelId == null ? null : toPositiveInt(rawRowGradeLevelId);

  if (
    rowSystemId !== normalizedScope.systemId ||
    rowStageId !== normalizedScope.stageId
  ) {
    return false;
  }

  if (normalizedScope.gradeLevelId == null) {
    return rowGradeLevelId == null;
  }

  return (
    rowGradeLevelId == null ||
    rowGradeLevelId === normalizedScope.gradeLevelId
  );
}

export function buildAcademicScopeMatchSql(
  scope,
  {
    systemColumn = "system_id",
    stageColumn = "stage_id",
    gradeLevelColumn = "grade_level_id",
  } = {}
) {
  const normalizedScope = normalizeResolvedScopeForMatching(
    scope?.systemId,
    scope?.stageId,
    scope?.gradeLevelId
  );

  if (!normalizedScope.systemId || !normalizedScope.stageId) {
    return { sql: "1 = 0", params: [] };
  }

  if (normalizedScope.gradeLevelId == null) {
    return {
      sql: `${systemColumn} = ? AND ${stageColumn} = ? AND ${gradeLevelColumn} IS NULL`,
      params: [normalizedScope.systemId, normalizedScope.stageId],
    };
  }

  return {
    sql:
      `${systemColumn} = ? AND ${stageColumn} = ? ` +
      `AND (${gradeLevelColumn} = ? OR ${gradeLevelColumn} IS NULL)`,
    params: [
      normalizedScope.systemId,
      normalizedScope.stageId,
      normalizedScope.gradeLevelId,
    ],
  };
}

export async function subjectIsAvailableForScope(
  subjectId,
  systemId,
  stageId,
  gradeLevelId,
  executor = pool
) {
  const normalizedSubjectId = toPositiveInt(subjectId);
  const normalizedSystemId = toPositiveInt(systemId);
  const normalizedStageId = toPositiveInt(stageId);
  const normalizedGradeLevelId =
    gradeLevelId == null ? null : toPositiveInt(gradeLevelId);

  if (!normalizedSubjectId || !normalizedSystemId || !normalizedStageId) {
    return false;
  }

  const scopeMatch = buildAcademicScopeMatchSql(
    {
      systemId: normalizedSystemId,
      stageId: normalizedStageId,
      gradeLevelId: normalizedGradeLevelId,
    },
    {
      systemColumn: "sa.system_id",
      stageColumn: "sa.stage_id",
      gradeLevelColumn: "sa.grade_level_id",
    }
  );

  const [[match]] = await executor.query(
    `
    SELECT 1
    FROM subject_availability sa
    INNER JOIN subjects s ON s.id = sa.subject_id
    WHERE sa.subject_id = ?
      AND sa.is_active = 1
      AND s.is_active = 1
      AND ${scopeMatch.sql}
    LIMIT 1
    `,
    [
      normalizedSubjectId,
      ...scopeMatch.params,
    ]
  );

  return Boolean(match);
}

function normalizeScopeDiscoveryInputs(subjectId, systemId, stageId, gradeLevelId) {
  return {
    normalizedSubjectId: toPositiveInt(subjectId),
    normalizedSystemId: toPositiveInt(systemId),
    normalizedStageId: toPositiveInt(stageId),
    normalizedGradeLevelId:
      gradeLevelId == null ? null : toPositiveInt(gradeLevelId),
  };
}

export async function listTeacherIdsWithLiveOfferingForScope(
  subjectId,
  systemId,
  stageId,
  gradeLevelId,
  executor = pool
) {
  const {
    normalizedSubjectId,
    normalizedSystemId,
    normalizedStageId,
    normalizedGradeLevelId,
  } = normalizeScopeDiscoveryInputs(subjectId, systemId, stageId, gradeLevelId);

  if (!normalizedSubjectId || !normalizedSystemId || !normalizedStageId) {
    return [];
  }

  const scopeMatch = buildAcademicScopeMatchSql(
    {
      systemId: normalizedSystemId,
      stageId: normalizedStageId,
      gradeLevelId: normalizedGradeLevelId,
    },
    {
      systemColumn: "system_id",
      stageColumn: "stage_id",
      gradeLevelColumn: "grade_level_id",
    }
  );

  const [rows] = await executor.query(
    `
    SELECT DISTINCT teacher_id
    FROM v_teacher_slot_offerings
    WHERE subject_id = ?
      AND schedule_is_active = 1
      AND offering_is_active = 1
      AND ${scopeMatch.sql}
    ORDER BY teacher_id ASC
    `,
    [
      normalizedSubjectId,
      ...scopeMatch.params,
    ]
  );

  return (rows || [])
    .map((row) => toPositiveInt(row.teacher_id))
    .filter(Boolean);
}

export async function teacherHasLiveOfferingForScope(
  teacherId,
  subjectId,
  systemId,
  stageId,
  gradeLevelId,
  executor = pool
) {
  const normalizedTeacherId = toPositiveInt(teacherId);
  const {
    normalizedSubjectId,
    normalizedSystemId,
    normalizedStageId,
    normalizedGradeLevelId,
  } = normalizeScopeDiscoveryInputs(subjectId, systemId, stageId, gradeLevelId);

  if (
    !normalizedTeacherId ||
    !normalizedSubjectId ||
    !normalizedSystemId ||
    !normalizedStageId
  ) {
    return false;
  }

  const scopeMatch = buildAcademicScopeMatchSql(
    {
      systemId: normalizedSystemId,
      stageId: normalizedStageId,
      gradeLevelId: normalizedGradeLevelId,
    },
    {
      systemColumn: "system_id",
      stageColumn: "stage_id",
      gradeLevelColumn: "grade_level_id",
    }
  );

  const [[match]] = await executor.query(
    `
    SELECT 1
    FROM v_teacher_slot_offerings
    WHERE teacher_id = ?
      AND subject_id = ?
      AND schedule_is_active = 1
      AND offering_is_active = 1
      AND ${scopeMatch.sql}
    LIMIT 1
    `,
    [
      normalizedTeacherId,
      normalizedSubjectId,
      ...scopeMatch.params,
    ]
  );

  return Boolean(match);
}

export async function scheduleHasLiveOfferingForScope(
  scheduleId,
  subjectId,
  systemId,
  stageId,
  gradeLevelId,
  executor = pool
) {
  const normalizedScheduleId = toPositiveInt(scheduleId);
  const normalizedSubjectId = toPositiveInt(subjectId);
  const normalizedScope = normalizeResolvedScopeForMatching(
    systemId,
    stageId,
    gradeLevelId
  );

  if (
    !normalizedScheduleId ||
    !normalizedSubjectId ||
    !normalizedScope.systemId ||
    !normalizedScope.stageId
  ) {
    return false;
  }

  const scopeMatch = buildAcademicScopeMatchSql(
    normalizedScope,
    {
      systemColumn: "system_id",
      stageColumn: "stage_id",
      gradeLevelColumn: "grade_level_id",
    }
  );

  const [[match]] = await executor.query(
    `
    SELECT 1
    FROM teacher_schedule_subjects
    WHERE schedule_id = ?
      AND subject_id = ?
      AND is_active = 1
      AND ${scopeMatch.sql}
    LIMIT 1
    `,
    [normalizedScheduleId, normalizedSubjectId, ...scopeMatch.params]
  );

  return Boolean(match);
}
