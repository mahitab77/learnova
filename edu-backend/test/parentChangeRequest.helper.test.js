import test from "node:test";
import assert from "node:assert/strict";

import { insertParentTeacherChangeRequest } from "../src/controllers/helpers/parentTeacherFlow.helpers.js";

test("insertParentTeacherChangeRequest writes schema-aligned columns only", async () => {
  let capturedSql = "";
  let capturedParams = [];

  const executor = {
    query: async (sql, params) => {
      capturedSql = String(sql);
      capturedParams = params;
      return [{ insertId: 321 }];
    },
  };

  const insertId = await insertParentTeacherChangeRequest(
    {
      parentId: 10,
      studentId: 20,
      subjectId: 30,
      currentTeacherId: 40,
      requestedTeacherId: 50,
      reason: "Needs a different teaching style.",
    },
    executor
  );

  assert.equal(insertId, 321);
  assert.match(capturedSql, /reason_text/i);
  assert.doesNotMatch(capturedSql, /\breason\b(?!_text)/i);
  assert.doesNotMatch(capturedSql, /requested_at/i);
  assert.deepEqual(capturedParams, [10, 20, 30, 40, 50, "Needs a different teaching style."]);
});
