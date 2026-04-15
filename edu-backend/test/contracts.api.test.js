import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

import app from "../src/app.js";
import pool from "../src/db.js";
import { hashPassword } from "../src/utils/password.js";

function assertRequestId(res) {
  const responseRequestId = res.headers["x-request-id"];
  assert.equal(typeof responseRequestId, "string");
  assert.ok(responseRequestId.length > 0);
}

test("contract: auth login success returns session cookie and me reflects authenticated session", async (t) => {
  const originalQuery = pool.query.bind(pool);
  const passwordHash = await hashPassword("StrongPass123");

  pool.query = async (sql, params = []) => {
    if (sql.includes("FROM users") && sql.includes("WHERE email = ?")) {
      return [[{
        id: 501,
        full_name: "Parent Contract User",
        email: String(params[0] || "").toLowerCase(),
        password_hash: passwordHash,
        role: "parent",
        is_active: 1,
      }]];
    }
    throw new Error(`Unexpected SQL in contract test: ${sql}`);
  };

  t.after(() => {
    pool.query = originalQuery;
  });

  const agent = request.agent(app);

  const loginRes = await agent.post("/auth/login").send({
    email: "parent.contract@example.com",
    password: "StrongPass123",
  });

  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.body?.success, true);
  assert.equal(loginRes.body?.data?.role, "parent");
  assert.ok(Array.isArray(loginRes.headers["set-cookie"]));
  assert.ok(loginRes.headers["set-cookie"].some((cookie) => cookie.startsWith("edu.sid=")));
  assertRequestId(loginRes);

  const meRes = await agent.get("/auth/me");
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body?.success, true);
  assert.equal(meRes.body?.data?.authenticated, true);
  assert.equal(meRes.body?.data?.user?.role, "parent");
  assertRequestId(meRes);
});

test("contract: student registration shape errors return validation payload", async () => {
  const res = await request(app).post("/auth/register-student").send({
    email: "missing-name@example.com",
    password: "StrongPass123",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body?.success, false);
  assert.equal(res.body?.code, "VALIDATION_ERROR");
  assert.equal(Array.isArray(res.body?.errors), true);
  assertRequestId(res);
});

test("contract: parent registration shape errors return validation payload", async () => {
  const res = await request(app).post("/auth/register-parent-with-children").send({
    parent: { fullName: "Parent Only" },
    children: [],
  });

  assert.equal(res.status, 400);
  assert.equal(res.body?.success, false);
  assert.equal(res.body?.code, "VALIDATION_ERROR");
  assert.equal(Array.isArray(res.body?.errors), true);
  assertRequestId(res);
});

test("contract: parent switch endpoint requires a real session", async () => {
  const res = await request(app).post("/parent/switch-to-student").send({
    studentUserId: 777,
  });

  assert.equal(res.status, 401);
  assert.equal(res.body?.success, false);
  assert.equal(res.body?.code, "SESSION_REQUIRED");
  assertRequestId(res);
});

test("contract: student booking endpoint enforces session-only student access", async () => {
  const res = await request(app).post("/student/lessons/request").send({
    teacherId: 10,
    subjectId: 20,
    scheduleId: 30,
    startsAt: "2026-06-01 10:00:00",
    endsAt: "2026-06-01 11:00:00",
  });

  assert.equal(res.status, 401);
  assert.equal(res.body?.success, false);
  assert.equal(res.body?.code, "SESSION_REQUIRED");
  assertRequestId(res);
});

test("contract: parent students payload uses normalized scope fields only", async (t) => {
  const originalQuery = pool.query.bind(pool);
  const passwordHash = await hashPassword("StrongPass123");

  pool.query = async (sql, params = []) => {
    if (sql.includes("FROM users") && sql.includes("WHERE email = ?")) {
      return [[{
        id: 901,
        full_name: "Parent Scope Contract",
        email: String(params[0] || "").toLowerCase(),
        password_hash: passwordHash,
        role: "parent",
        is_active: 1,
      }]];
    }
    if (sql.includes("SELECT id, is_active FROM users WHERE id = ?")) {
      return [[{ id: Number(params[0]), is_active: 1 }]];
    }
    if (sql.includes("SELECT id, user_id, phone, notes FROM parents WHERE user_id = ?")) {
      return [[{ id: 77, user_id: Number(params[0]), phone: null, notes: null }]];
    }
    if (sql.includes("FROM parent_students ps") && sql.includes("AS link_id")) {
      return [[{
        link_id: 8001,
        student_id: 5001,
        student_name: "Child Scope Contract",
        system_id: 2,
        stage_id: 12,
        grade_level_id: 120,
        system_name: "National",
        stage_name: "Primary",
        grade_level_name: "Grade 4",
        relationship: "mother",
        has_own_login: 1,
        student_user_id: 7001,
      }]];
    }
    throw new Error(`Unexpected SQL in parent scope contract test: ${sql}`);
  };

  t.after(() => {
    pool.query = originalQuery;
  });

  const agent = request.agent(app);
  const loginRes = await agent.post("/auth/login").send({
    email: "parent.scope.contract@example.com",
    password: "StrongPass123",
  });
  assert.equal(loginRes.status, 200);

  const res = await agent.get("/parent/students");
  assert.equal(res.status, 200);
  assert.equal(res.body?.success, true);
  assert.equal(Array.isArray(res.body?.data), true);
  assert.equal(res.body.data.length, 1);

  const row = res.body.data[0];
  assert.equal(typeof row.system_id, "number");
  assert.equal(typeof row.stage_id, "number");
  assert.equal(typeof row.grade_level_id, "number");
  assert.equal(typeof row.system_name, "string");
  assert.equal(typeof row.stage_name, "string");
  assert.equal(typeof row.grade_level_name, "string");
  assert.equal("grade_stage" in row, false);
  assert.equal("grade_number" in row, false);
  assertRequestId(res);
});

test("contract: student dashboard payload keeps normalized scope contract", async (t) => {
  const originalQuery = pool.query.bind(pool);
  const passwordHash = await hashPassword("StrongPass123");

  pool.query = async (sql, params = []) => {
    if (sql.includes("FROM users") && sql.includes("WHERE email = ?")) {
      return [[{
        id: 1201,
        full_name: "Student Dashboard Contract",
        email: String(params[0] || "").toLowerCase(),
        password_hash: passwordHash,
        role: "student",
        is_active: 1,
      }]];
    }
    if (sql.includes("FROM students s") && sql.includes("parent_link_count")) {
      return [[{
        student_id: 301,
        parent_link_count: 0,
        direct_login_enabled: 0,
      }]];
    }
    if (sql.includes("SELECT id, is_active FROM users WHERE id = ?")) {
      return [[{ id: Number(params[0]), is_active: 1 }]];
    }
    if (sql.includes("SELECT id, full_name, preferred_lang, role, is_active") && sql.includes("FROM users")) {
      return [[{
        id: Number(params[0]),
        full_name: "Student Dashboard Contract",
        preferred_lang: "en",
        role: "student",
        is_active: 1,
      }]];
    }
    if (sql.includes("FROM students") && sql.includes("WHERE user_id = ?")) {
      return [[{
        id: 301,
        user_id: Number(params[0]),
        system_id: 2,
        stage_id: 12,
        grade_level_id: 120,
        gender: "male",
        onboarding_completed: 1,
      }]];
    }
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      return [[]];
    }
    throw new Error(`Unexpected SQL in student dashboard contract test: ${sql}`);
  };

  t.after(() => {
    pool.query = originalQuery;
  });

  const agent = request.agent(app);
  const loginRes = await agent.post("/auth/login").send({
    email: "student.dashboard.contract@example.com",
    password: "StrongPass123",
  });
  assert.equal(loginRes.status, 200);

  const res = await agent.get("/student/dashboard");
  assert.equal(res.status, 200);
  assert.equal(res.body?.success, true);
  assert.equal(typeof res.body?.data?.student?.systemId, "number");
  assert.equal(typeof res.body?.data?.student?.stageId, "number");
  assert.equal(typeof res.body?.data?.student?.gradeLevelId, "number");
  assert.equal(res.body?.data?.student?.gradeStage, null);
  assert.equal(res.body?.data?.student?.gradeNumber, null);
  assert.equal(Array.isArray(res.body?.data?.subjects), true);
  assert.equal(Array.isArray(res.body?.data?.upcomingLessons), true);
  assertRequestId(res);
});
