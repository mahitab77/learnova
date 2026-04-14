import pool from "../db.js";
import {
  listTeacherIdsWithLiveOfferingForScope,
  resolveStudentAcademicIds,
  subjectIsAvailableForScope,
  teacherHasLiveOfferingForScope,
} from "../utils/academicScope.js";

function toPositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
}

const DEFAULT_MESSAGES = {
  student: {
    scopeResolution:
      "Student academic scope could not be resolved. Ensure students.system_id and students.stage_id are populated.",
    subjectUnavailable:
      "This subject is not available for the student's academic level.",
    teacherInvalid: "teacherId must be a valid number.",
    teacherInactiveOrUnapproved: "Teacher not found, inactive, or not approved.",
    teacherNoLiveOffering:
      "This teacher does not currently have a live offering for the student's academic level in this subject.",
  },
  child: {
    scopeResolution:
      "Child academic scope could not be resolved. Ensure students.system_id and students.stage_id are populated.",
    subjectUnavailable:
      "This subject is not available for the child's academic level.",
    teacherInvalid: "teacher_id must be a valid positive number.",
    teacherInactiveOrUnapproved: "Teacher not found, inactive, or not approved.",
    teacherNoLiveOffering:
      "The selected teacher does not have a live offering for this child's academic level.",
  },
};

function buildMessages(actorType = "student", overrides = {}) {
  const defaults =
    actorType === "child" ? DEFAULT_MESSAGES.child : DEFAULT_MESSAGES.student;
  return { ...defaults, ...(overrides || {}) };
}

async function filterApprovedActiveTeacherIds(teacherIds, executor = pool) {
  const normalizedTeacherIds = [...new Set((teacherIds || []).map(toPositiveInt).filter(Boolean))];
  if (!normalizedTeacherIds.length) {
    return [];
  }

  const [rows] = await executor.query(
    `
    SELECT t.id
    FROM teachers t
    INNER JOIN users u ON u.id = t.user_id
    WHERE t.id IN (?)
      AND t.is_active = 1
      AND t.status = 'approved'
      AND u.is_active = 1
      AND u.role = 'teacher'
    ORDER BY t.id ASC
    `,
    [normalizedTeacherIds]
  );

  return (rows || []).map((row) => toPositiveInt(row.id)).filter(Boolean);
}

async function resolveScopedSubjectContext(
  studentOrId,
  subjectId,
  { executor = pool, actorType = "student", messages: overrides } = {}
) {
  const messages = buildMessages(actorType, overrides);
  const normalizedSubjectId = toPositiveInt(subjectId);

  if (!normalizedSubjectId) {
    return {
      ok: false,
      status: 400,
      message: "subjectId must be a valid number.",
    };
  }

  const { systemId, stageId, gradeLevelId, source } =
    await resolveStudentAcademicIds(studentOrId, executor);

  if (!systemId || !stageId) {
    return {
      ok: false,
      status: 400,
      message: messages.scopeResolution,
    };
  }

  const subjectAllowed = await subjectIsAvailableForScope(
    normalizedSubjectId,
    systemId,
    stageId,
    gradeLevelId,
    executor
  );

  if (!subjectAllowed) {
    return {
      ok: false,
      status: 400,
      message: messages.subjectUnavailable,
    };
  }

  return {
    ok: true,
    context: {
      subjectId: normalizedSubjectId,
      systemId,
      stageId,
      gradeLevelId,
      source,
    },
    messages,
  };
}

/**
 * Shared live-offering-based discovery path used by both student and parent flows.
 * We intentionally reuse the same scope + subject gate before listing teachers so
 * the discovery UI and write paths stay aligned with current booking rules.
 */
export async function listEligibleTeacherIdsForSubjectScope(
  studentOrId,
  subjectId,
  options = {}
) {
  const scoped = await resolveScopedSubjectContext(studentOrId, subjectId, options);
  if (!scoped.ok) {
    return scoped;
  }

  const { context } = scoped;
  const offeringTeacherIds = await listTeacherIdsWithLiveOfferingForScope(
    context.subjectId,
    context.systemId,
    context.stageId,
    context.gradeLevelId,
    options.executor ?? pool
  );

  const teacherIds = await filterApprovedActiveTeacherIds(
    offeringTeacherIds,
    options.executor ?? pool
  );

  return {
    ok: true,
    teacherIds,
    context,
  };
}

/**
 * Shared write-path validator for teacher selection/change requests.
 * Teacher active/approved checks live here instead of being left implicit in
 * controller-specific queries, so parent and student writes now enforce the same
 * backend truth as discovery.
 */
export async function assertTeacherEligibleForSubjectScope(
  teacherId,
  studentOrId,
  subjectId,
  options = {}
) {
  const scoped = await resolveScopedSubjectContext(studentOrId, subjectId, options);
  if (!scoped.ok) {
    return scoped;
  }

  const { context, messages } = scoped;
  const normalizedTeacherId = toPositiveInt(teacherId);

  if (!normalizedTeacherId) {
    return {
      ok: false,
      status: 400,
      message: messages.teacherInvalid,
    };
  }

  const activeTeacherIds = await filterApprovedActiveTeacherIds(
    [normalizedTeacherId],
    options.executor ?? pool
  );

  if (!activeTeacherIds.length) {
    return {
      ok: false,
      status: 400,
      message: messages.teacherInactiveOrUnapproved,
    };
  }

  const hasOffering = await teacherHasLiveOfferingForScope(
    normalizedTeacherId,
    context.subjectId,
    context.systemId,
    context.stageId,
    context.gradeLevelId,
    options.executor ?? pool
  );

  if (!hasOffering) {
    return {
      ok: false,
      status: 400,
      message: messages.teacherNoLiveOffering,
    };
  }

  return {
    ok: true,
    teacherId: normalizedTeacherId,
    context,
  };
}
