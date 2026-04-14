import assert from "node:assert/strict";
import test from "node:test";

import { upsertTeacherSelection } from "../src/services/teacherSelection.service.js";

function createTeacherSelectionExecutor(seedRows = []) {
  let nextId =
    seedRows.reduce((maxId, row) => Math.max(maxId, Number(row.id) || 0), 0) + 1;
  let tick = 0;
  const rows = seedRows.map((row) => ({ ...row }));

  function nextTimestamp() {
    tick += 1;
    return `2026-04-13 12:00:${String(tick).padStart(2, "0")}`;
  }

  function findSelection(studentId, subjectId) {
    return rows.find(
      (row) =>
        Number(row.student_id) === Number(studentId) &&
        Number(row.subject_id) === Number(subjectId)
    );
  }

  return {
    rows,
    async query(sql, params) {
      if (sql.includes("INSERT INTO student_teacher_selections")) {
        const [studentId, subjectId, teacherId, selectedBy] = params;
        const existing = findSelection(studentId, subjectId);
        const selectedAt = nextTimestamp();

        if (existing) {
          existing.teacher_id = Number(teacherId);
          existing.selected_by = selectedBy;
          existing.status = "active";
          existing.selected_at = selectedAt;
          return [{ insertId: 0, affectedRows: 2 }];
        }

        const row = {
          id: nextId++,
          student_id: Number(studentId),
          subject_id: Number(subjectId),
          teacher_id: Number(teacherId),
          selected_by: selectedBy,
          status: "active",
          selected_at: selectedAt,
        };

        rows.push(row);
        return [{ insertId: row.id, affectedRows: 1 }];
      }

      if (
        sql.includes("FROM student_teacher_selections") &&
        sql.includes("WHERE student_id = ? AND subject_id = ?")
      ) {
        const [studentId, subjectId] = params;
        const row = findSelection(studentId, subjectId);
        return [row ? [{ ...row }] : []];
      }

      throw new Error(`Unexpected SQL in test executor: ${sql}`);
    },
  };
}

test("parent insert stamps selected_by=parent and status=active", async () => {
  const executor = createTeacherSelectionExecutor();

  const row = await upsertTeacherSelection(executor, {
    studentId: 11,
    subjectId: 22,
    teacherId: 33,
    selectedBy: "parent",
  });

  assert.deepEqual(
    {
      student_id: row.student_id,
      subject_id: row.subject_id,
      teacher_id: row.teacher_id,
      selected_by: row.selected_by,
      status: row.status,
    },
    {
      student_id: 11,
      subject_id: 22,
      teacher_id: 33,
      selected_by: "parent",
      status: "active",
    }
  );
  assert.ok(row.id);
  assert.ok(row.selected_at);
});

test("parent update from stale state restores active status, selected_by, and selected_at", async () => {
  const executor = createTeacherSelectionExecutor([
    {
      id: 7,
      student_id: 44,
      subject_id: 55,
      teacher_id: 66,
      selected_by: "student",
      status: "pending_change",
      selected_at: "2026-04-13 11:59:00",
    },
  ]);

  const row = await upsertTeacherSelection(executor, {
    studentId: 44,
    subjectId: 55,
    teacherId: 77,
    selectedBy: "parent",
  });

  assert.deepEqual(
    {
      id: row.id,
      teacher_id: row.teacher_id,
      selected_by: row.selected_by,
      status: row.status,
    },
    {
      id: 7,
      teacher_id: 77,
      selected_by: "parent",
      status: "active",
    }
  );
  assert.notEqual(row.selected_at, "2026-04-13 11:59:00");
});

test("student direct assignment stamps selected_by=student and status=active", async () => {
  const executor = createTeacherSelectionExecutor();

  const row = await upsertTeacherSelection(executor, {
    studentId: 101,
    subjectId: 202,
    teacherId: 303,
    selectedBy: "student",
  });

  assert.equal(row.selected_by, "student");
  assert.equal(row.status, "active");
});

test("admin direct assignments stamp selected_by=admin and status=active for both write paths", async () => {
  const executor = createTeacherSelectionExecutor([
    {
      id: 9,
      student_id: 501,
      subject_id: 601,
      teacher_id: 701,
      selected_by: "student",
      status: "replaced",
      selected_at: "2026-04-13 11:58:00",
    },
  ]);

  const approvedRequestRow = await upsertTeacherSelection(executor, {
    studentId: 501,
    subjectId: 601,
    teacherId: 702,
    selectedBy: "admin",
  });
  const reassignedRow = await upsertTeacherSelection(executor, {
    studentId: 502,
    subjectId: 602,
    teacherId: 703,
    selectedBy: "admin",
  });

  assert.equal(approvedRequestRow.selected_by, "admin");
  assert.equal(approvedRequestRow.status, "active");
  assert.equal(approvedRequestRow.teacher_id, 702);
  assert.equal(reassignedRow.selected_by, "admin");
  assert.equal(reassignedRow.status, "active");
  assert.equal(reassignedRow.teacher_id, 703);
});

test("active-only readers can still see rows after parent and admin direct assignments", async () => {
  const executor = createTeacherSelectionExecutor();

  await upsertTeacherSelection(executor, {
    studentId: 900,
    subjectId: 901,
    teacherId: 902,
    selectedBy: "parent",
  });
  await upsertTeacherSelection(executor, {
    studentId: 900,
    subjectId: 903,
    teacherId: 904,
    selectedBy: "admin",
  });

  const activeRows = executor.rows.filter(
    (row) => row.student_id === 900 && row.status === "active"
  );

  assert.deepEqual(
    activeRows.map((row) => ({
      subject_id: row.subject_id,
      selected_by: row.selected_by,
      status: row.status,
    })),
    [
      { subject_id: 901, selected_by: "parent", status: "active" },
      { subject_id: 903, selected_by: "admin", status: "active" },
    ]
  );
});
