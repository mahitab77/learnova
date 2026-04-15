import pool from "../../db.js";
import {
  assertTeacherEligibleForSubjectScope,
  listEligibleTeacherIdsForSubjectScope,
} from "../../services/teacherDiscovery.service.js";

export async function findParentByUserId(userId, executor = pool) {
  const [rows] = await executor.query(
    "SELECT id, user_id, phone, notes FROM parents WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows.length ? rows[0] : null;
}

export async function findStudentById(studentId, executor = pool) {
  const [rows] = await executor.query(
    `
    SELECT id, user_id, system_id, stage_id, grade_level_id
    FROM students
    WHERE id = ?
    LIMIT 1
    `,
    [studentId]
  );
  return rows.length ? rows[0] : null;
}

export async function findActiveTeacherSelectionForStudentSubject(
  studentId,
  subjectId,
  executor = pool
) {
  const [rows] = await executor.query(
    `
    SELECT id, teacher_id
    FROM student_teacher_selections
    WHERE student_id = ?
      AND subject_id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [studentId, subjectId]
  );
  return rows.length ? rows[0] : null;
}

async function findActiveTeacherSelectionById(
  selectionId,
  studentId,
  subjectId,
  executor = pool
) {
  const [rows] = await executor.query(
    `
    SELECT id, teacher_id
    FROM student_teacher_selections
    WHERE id = ?
      AND student_id = ?
      AND subject_id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [selectionId, studentId, subjectId]
  );
  return rows.length ? rows[0] : null;
}

async function studentHasSelectedSubject(studentId, subjectId, executor = pool) {
  const [rows] = await executor.query(
    `
    SELECT id
    FROM student_subjects
    WHERE student_id = ? AND subject_id = ?
    LIMIT 1
    `,
    [studentId, subjectId]
  );
  return rows.length > 0;
}

export async function assertTeacherEligibleForChild(
  teacherId,
  student,
  subjectId,
  childScopeResolutionError,
  executor = pool
) {
  return assertTeacherEligibleForSubjectScope(teacherId, student, subjectId, {
    executor,
    actorType: "child",
    messages: {
      scopeResolution: childScopeResolutionError,
    },
  });
}

export async function listEligibleTeacherIdsForChild(
  student,
  subjectId,
  childScopeResolutionError,
  executor = pool
) {
  return listEligibleTeacherIdsForSubjectScope(student, subjectId, {
    executor,
    actorType: "child",
    messages: {
      scopeResolution: childScopeResolutionError,
    },
  });
}

export async function loadParentTeacherFlowContext(
  { authedUserId, studentId, subjectId },
  executor = pool
) {
  const parent = await findParentByUserId(authedUserId, executor);
  if (!parent) {
    return { ok: false, status: 403, message: "Parent profile not found for this user." };
  }

  const [linkRows] = await executor.query(
    `
    SELECT id
    FROM parent_students
    WHERE parent_id = ? AND student_id = ?
    LIMIT 1
    `,
    [parent.id, studentId]
  );

  if (linkRows.length === 0) {
    return {
      ok: false,
      status: 403,
      message: "This student is not linked to the current parent user.",
    };
  }

  const student = await findStudentById(studentId, executor);
  if (!student) return { ok: false, status: 404, message: "Student not found." };

  const hasSelectedSubject = await studentHasSelectedSubject(
    studentId,
    subjectId,
    executor
  );
  if (!hasSelectedSubject) {
    return {
      ok: false,
      status: 400,
      message:
        "This subject is not selected for the student. Please add the subject first.",
    };
  }

  const currentSelection = await findActiveTeacherSelectionForStudentSubject(
    studentId,
    subjectId,
    executor
  );
  return { ok: true, parent, student, currentSelection };
}

export async function prepareParentTeacherChangeRequest(
  {
    authedUserId,
    studentId,
    subjectId,
    currentTeacherId = null,
    requestedTeacherId = null,
    selectionId = null,
    childScopeResolutionError,
  },
  executor = pool
) {
  const flowContext = await loadParentTeacherFlowContext(
    { authedUserId, studentId, subjectId },
    executor
  );
  if (!flowContext.ok) return flowContext;

  const { parent, student, currentSelection } = flowContext;

  if (selectionId != null) {
    const selectionRow = await findActiveTeacherSelectionById(
      selectionId,
      studentId,
      subjectId,
      executor
    );
    if (!selectionRow) {
      return {
        ok: false,
        status: 400,
        message:
          "The provided selection_id does not belong to this student's active teacher selection for the subject.",
      };
    }

    if (
      currentSelection?.id &&
      Number(selectionRow.id) !== Number(currentSelection.id)
    ) {
      return {
        ok: false,
        status: 400,
        message:
          "The provided selection_id does not match the current active teacher selection for this student and subject.",
      };
    }
  }

  const activeSelection = currentSelection;
  if (!activeSelection) {
    return {
      ok: false,
      status: 400,
      message:
        "No active teacher selection exists for this student/subject. Direct parent assignment should be used instead.",
    };
  }

  const activeTeacherId = Number(activeSelection.teacher_id);
  if (!Number.isFinite(activeTeacherId) || activeTeacherId <= 0) {
    return {
      ok: false,
      status: 400,
      message: "Current active teacher selection is invalid.",
    };
  }

  if (currentTeacherId != null && Number(currentTeacherId) !== activeTeacherId) {
    return {
      ok: false,
      status: 400,
      message: "currentTeacherId does not match the current active teacher selection.",
    };
  }

  const desiredTeacherId = Number(requestedTeacherId);
  if (!Number.isFinite(desiredTeacherId) || desiredTeacherId <= 0) {
    return { ok: false, status: 400, message: "requestedTeacherId must be a valid integer." };
  }
  if (desiredTeacherId === activeTeacherId) {
    return {
      ok: false,
      status: 400,
      message:
        "The requested teacher is already the student's active teacher for this subject.",
    };
  }

  const eligibility = await assertTeacherEligibleForChild(
    desiredTeacherId,
    student,
    subjectId,
    childScopeResolutionError,
    executor
  );
  if (!eligibility?.ok) {
    return {
      ok: false,
      status: eligibility?.status || 400,
      message: eligibility?.message || "Requested teacher is not eligible for this child.",
    };
  }

  return {
    ok: true,
    parentId: parent.id,
    studentId,
    subjectId,
    currentTeacherId: activeTeacherId,
    requestedTeacherId: desiredTeacherId,
  };
}

export async function insertParentTeacherChangeRequest(
  { parentId, studentId, subjectId, currentTeacherId, requestedTeacherId, reason = null },
  executor = pool
) {
  const [result] = await executor.query(
    `
    INSERT INTO parent_change_requests
      (parent_id, student_id, subject_id, current_teacher_id, requested_teacher_id, reason_text, status)
    VALUES
      (?, ?, ?, ?, ?, ?, 'pending')
    `,
    [parentId, studentId, subjectId, currentTeacherId, requestedTeacherId, reason]
  );
  return result.insertId;
}
