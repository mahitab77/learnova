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
