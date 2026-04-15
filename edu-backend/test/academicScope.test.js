import test from "node:test";
import assert from "node:assert/strict";

import {
  academicScopeMatchesRow,
  buildAcademicScopeMatchSql,
  listTeacherIdsWithLiveOfferingForScope,
  scheduleHasLiveOfferingForScope,
  subjectIsAvailableForScope,
  teacherHasLiveOfferingForScope,
} from "../src/utils/academicScope.js";
import { buildStudentTeacherAvailabilityRequestContext } from "../src/controllers/student.controller.js";

function createScopeMatchExecutor({
  subjectAvailabilityRows = [],
  offeringRows = [],
} = {}) {
  const queries = [];

  function extractScope(params, startIndex = 0) {
    const systemId = params[startIndex] ?? null;
    const stageId = params[startIndex + 1] ?? null;
    const gradeLevelId = params.length > startIndex + 2 ? params[startIndex + 2] : null;
    return { systemId, stageId, gradeLevelId };
  }

  return {
    queries,
    async query(sql, params) {
      queries.push({ sql, params });

      if (sql.includes("FROM subject_availability")) {
        const subjectId = params[0];
        const scope = extractScope(params, 1);

        const matches = subjectAvailabilityRows.filter(
          (row) =>
            row.subject_id === subjectId &&
            row.is_active !== 0 &&
            row.subject_is_active !== 0 &&
            academicScopeMatchesRow(scope, row)
        );

        return [matches.length ? [{ match: 1 }] : []];
      }

      if (sql.includes("FROM v_teacher_slot_offerings")) {
        const isTeacherSpecific = sql.includes("WHERE teacher_id = ?");
        const teacherId = isTeacherSpecific ? params[0] : null;
        const subjectId = isTeacherSpecific ? params[1] : params[0];
        const scope = extractScope(params, isTeacherSpecific ? 2 : 1);

        const matches = offeringRows.filter(
          (row) =>
            row.subject_id === subjectId &&
            row.schedule_is_active !== 0 &&
            row.offering_is_active !== 0 &&
            (!isTeacherSpecific || row.teacher_id === teacherId) &&
            academicScopeMatchesRow(scope, row)
        );

        if (isTeacherSpecific) {
          return [matches.length ? [{ match: 1 }] : []];
        }

        return [matches.map((row) => ({ teacher_id: row.teacher_id }))];
      }

      if (sql.includes("FROM teacher_schedule_subjects")) {
        const scheduleId = params[0];
        const subjectId = params[1];
        const scope = extractScope(params, 2);

        const matches = offeringRows.filter(
          (row) =>
            row.schedule_id === scheduleId &&
            row.subject_id === subjectId &&
            row.is_active !== 0 &&
            academicScopeMatchesRow(scope, row)
        );

        return [matches.length ? [{ match: 1 }] : []];
      }

      throw new Error(`Unexpected SQL in test executor: ${sql}`);
    },
  };
}

test("academicScopeMatchesRow implements the authoritative matching rule", async (t) => {
  const cases = [
    {
      name: "A. null-grade student matches stage-wide row",
      scope: { systemId: 1, stageId: 2, gradeLevelId: null },
      row: { system_id: 1, stage_id: 2, grade_level_id: null },
      expected: true,
    },
    {
      name: "B. null-grade student does not match grade-specific row",
      scope: { systemId: 1, stageId: 2, gradeLevelId: null },
      row: { system_id: 1, stage_id: 2, grade_level_id: 5 },
      expected: false,
    },
    {
      name: "C. specific-grade student matches same grade row",
      scope: { systemId: 1, stageId: 2, gradeLevelId: 5 },
      row: { system_id: 1, stage_id: 2, grade_level_id: 5 },
      expected: true,
    },
    {
      name: "D. specific-grade student matches stage-wide row",
      scope: { systemId: 1, stageId: 2, gradeLevelId: 5 },
      row: { system_id: 1, stage_id: 2, grade_level_id: null },
      expected: true,
    },
    {
      name: "E. specific-grade student does not match different grade row",
      scope: { systemId: 1, stageId: 2, gradeLevelId: 5 },
      row: { system_id: 1, stage_id: 2, grade_level_id: 6 },
      expected: false,
    },
    {
      name: "F. wrong stage never matches",
      scope: { systemId: 1, stageId: 2, gradeLevelId: 5 },
      row: { system_id: 1, stage_id: 3, grade_level_id: 5 },
      expected: false,
    },
    {
      name: "G. wrong system never matches",
      scope: { systemId: 1, stageId: 2, gradeLevelId: 5 },
      row: { system_id: 2, stage_id: 2, grade_level_id: 5 },
      expected: false,
    },
  ];

  for (const scenario of cases) {
    await t.test(scenario.name, () => {
      assert.equal(
        academicScopeMatchesRow(scenario.scope, scenario.row),
        scenario.expected
      );
    });
  }
});

test("buildAcademicScopeMatchSql uses stage-wide-only branch for null-grade students", () => {
  const clause = buildAcademicScopeMatchSql(
    { systemId: 1, stageId: 2, gradeLevelId: null },
    {
      systemColumn: "sa.system_id",
      stageColumn: "sa.stage_id",
      gradeLevelColumn: "sa.grade_level_id",
    }
  );

  assert.equal(
    clause.sql,
    "sa.system_id = ? AND sa.stage_id = ? AND sa.grade_level_id IS NULL"
  );
  assert.deepEqual(clause.params, [1, 2]);
});

test("subject availability helper does not expose grade-specific-only rows to null-grade students", async () => {
  const executor = createScopeMatchExecutor({
    subjectAvailabilityRows: [
      {
        subject_id: 10,
        system_id: 1,
        stage_id: 2,
        grade_level_id: 5,
        is_active: 1,
        subject_is_active: 1,
      },
    ],
  });

  const allowed = await subjectIsAvailableForScope(10, 1, 2, null, executor);

  assert.equal(allowed, false);
  assert.match(executor.queries[0].sql, /sa\.grade_level_id IS NULL/);
  assert.doesNotMatch(executor.queries[0].sql, /\? IS NULL/);
});

test("teacher discovery returns only scope-valid live offerings", async () => {
  const executor = createScopeMatchExecutor({
    offeringRows: [
      {
        teacher_id: 101,
        subject_id: 10,
        system_id: 1,
        stage_id: 2,
        grade_level_id: 5,
        schedule_is_active: 1,
        offering_is_active: 1,
        is_active: 1,
        schedule_id: 1001,
      },
      {
        teacher_id: 102,
        subject_id: 10,
        system_id: 1,
        stage_id: 2,
        grade_level_id: null,
        schedule_is_active: 1,
        offering_is_active: 1,
        is_active: 1,
        schedule_id: 1002,
      },
    ],
  });

  const teacherIds = await listTeacherIdsWithLiveOfferingForScope(
    10,
    1,
    2,
    null,
    executor
  );

  assert.deepEqual(teacherIds, [102]);
  assert.match(executor.queries[0].sql, /grade_level_id IS NULL/);
  assert.doesNotMatch(executor.queries[0].sql, /\? IS NULL/);
});

test("teacher selection and booking helpers reject grade-specific-only offerings for null-grade students", async () => {
  const executor = createScopeMatchExecutor({
    offeringRows: [
      {
        teacher_id: 301,
        subject_id: 40,
        system_id: 1,
        stage_id: 2,
        grade_level_id: 5,
        schedule_is_active: 1,
        offering_is_active: 1,
        is_active: 1,
        schedule_id: 7001,
      },
    ],
  });

  const teacherMatch = await teacherHasLiveOfferingForScope(
    301,
    40,
    1,
    2,
    null,
    executor
  );
  const bookingMatch = await scheduleHasLiveOfferingForScope(
    7001,
    40,
    1,
    2,
    null,
    executor
  );

  assert.equal(teacherMatch, false);
  assert.equal(bookingMatch, false);
});

test("null-grade semantics stay consistent across discovery, selection, and booking", async () => {
  const executor = createScopeMatchExecutor({
    offeringRows: [
      {
        teacher_id: 410,
        subject_id: 51,
        system_id: 1,
        stage_id: 2,
        grade_level_id: 6,
        schedule_is_active: 1,
        offering_is_active: 1,
        is_active: 1,
        schedule_id: 8101,
      },
      {
        teacher_id: 411,
        subject_id: 51,
        system_id: 1,
        stage_id: 2,
        grade_level_id: null,
        schedule_is_active: 1,
        offering_is_active: 1,
        is_active: 1,
        schedule_id: 8102,
      },
    ],
  });

  const discoveryRows = await listTeacherIdsWithLiveOfferingForScope(
    51,
    1,
    2,
    null,
    executor
  );
  const selectionGradeSpecific = await teacherHasLiveOfferingForScope(
    410,
    51,
    1,
    2,
    null,
    executor
  );
  const selectionStageWide = await teacherHasLiveOfferingForScope(
    411,
    51,
    1,
    2,
    null,
    executor
  );
  const bookingGradeSpecific = await scheduleHasLiveOfferingForScope(
    8101,
    51,
    1,
    2,
    null,
    executor
  );
  const bookingStageWide = await scheduleHasLiveOfferingForScope(
    8102,
    51,
    1,
    2,
    null,
    executor
  );

  assert.deepEqual(discoveryRows, [411]);
  assert.equal(selectionGradeSpecific, false);
  assert.equal(selectionStageWide, true);
  assert.equal(bookingGradeSpecific, false);
  assert.equal(bookingStageWide, true);
});

test("teacher availability response filtering keeps only stage-wide offerings for null-grade students", () => {
  const scope = { systemId: 1, stageId: 2, gradeLevelId: null };
  const slotScopes = [
    { id: 1, system_id: 1, stage_id: 2, grade_level_id: null },
    { id: 2, system_id: 1, stage_id: 2, grade_level_id: 5 },
    { id: 3, system_id: 1, stage_id: 3, grade_level_id: null },
  ];

  const visibleRows = slotScopes.filter((row) =>
    academicScopeMatchesRow(scope, row)
  );

  assert.deepEqual(
    visibleRows.map((row) => row.id),
    [1]
  );
});

test("student teacher-availability ignores query-supplied academic scope overrides", () => {
  const requestContext = buildStudentTeacherAvailabilityRequestContext(
    {
      teacher_id: "77",
      system_id: "9",
      stage_id: "99",
      grade_level_id: "999",
      from: "2026-04-14",
      to: "2026-04-20",
    },
    {
      system_id: 1,
      stage_id: 2,
      grade_level_id: 5,
    }
  );

  assert.equal(requestContext.teacherId, 77);
  assert.equal(requestContext.from, "2026-04-14");
  assert.equal(requestContext.to, "2026-04-20");
  assert.equal(requestContext.scopeError, null);
  assert.deepEqual(requestContext.scope, {
    systemId: 1,
    stageId: 2,
    gradeLevelId: 5,
  });

  const visibleRows = [
    { id: 1, system_id: 1, stage_id: 2, grade_level_id: 5 },
    { id: 2, system_id: 1, stage_id: 2, grade_level_id: null },
    { id: 3, system_id: 9, stage_id: 99, grade_level_id: 999 },
  ].filter((row) => academicScopeMatchesRow(requestContext.scope, row));

  assert.deepEqual(
    visibleRows.map((row) => row.id),
    [1, 2]
  );
});

test("student teacher-availability keeps null-grade students stage-wide even when query tries to force a grade", () => {
  const requestContext = buildStudentTeacherAvailabilityRequestContext(
    {
      teacher_id: "88",
      grade_level_id: "5",
    },
    {
      system_id: 1,
      stage_id: 2,
      grade_level_id: null,
    }
  );

  assert.equal(requestContext.scopeError, null);
  assert.deepEqual(requestContext.scope, {
    systemId: 1,
    stageId: 2,
    gradeLevelId: null,
  });

  const visibleRows = [
    { id: 1, system_id: 1, stage_id: 2, grade_level_id: null },
    { id: 2, system_id: 1, stage_id: 2, grade_level_id: 5 },
  ].filter((row) => academicScopeMatchesRow(requestContext.scope, row));

  assert.deepEqual(
    visibleRows.map((row) => row.id),
    [1]
  );
});

test("student teacher-availability fails explicitly when normalized system or stage is missing", () => {
  const missingSystem = buildStudentTeacherAvailabilityRequestContext(
    {
      teacher_id: "99",
      system_id: "9",
      stage_id: "99",
    },
    {
      system_id: null,
      stage_id: 2,
      grade_level_id: 5,
    }
  );

  const missingStage = buildStudentTeacherAvailabilityRequestContext(
    {
      teacher_id: "99",
      system_id: "9",
      stage_id: "99",
    },
    {
      system_id: 1,
      stage_id: null,
      grade_level_id: 5,
    }
  );

  assert.equal(
    missingSystem.scopeError,
    "Student academic scope is incomplete. Please complete profile/onboarding before viewing teacher availability."
  );
  assert.equal(
    missingStage.scopeError,
    "Student academic scope is incomplete. Please complete profile/onboarding before viewing teacher availability."
  );
  assert.deepEqual(missingSystem.scope, {
    systemId: null,
    stageId: 2,
    gradeLevelId: 5,
  });
  assert.deepEqual(missingStage.scope, {
    systemId: 1,
    stageId: null,
    gradeLevelId: 5,
  });
});

test("student teacher-availability happy path still returns authoritative normalized scope", () => {
  const requestContext = buildStudentTeacherAvailabilityRequestContext(
    {
      teacherId: "101",
      from: "2026-04-21",
      to: "2026-04-28",
    },
    {
      system_id: 3,
      stage_id: 4,
      grade_level_id: 7,
    }
  );

  assert.equal(requestContext.teacherId, 101);
  assert.equal(requestContext.from, "2026-04-21");
  assert.equal(requestContext.to, "2026-04-28");
  assert.equal(requestContext.scopeError, null);
  assert.deepEqual(requestContext.scope, {
    systemId: 3,
    stageId: 4,
    gradeLevelId: 7,
  });
});
