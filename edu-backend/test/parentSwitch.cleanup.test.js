import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import * as authController from "../src/controllers/auth.controller.js";
import * as parentController from "../src/controllers/parent.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

test("auth controller no longer exports the stale switchStudent implementation", () => {
  assert.equal("switchStudent" in authController, false);
  assert.equal(typeof parentController.switchToStudent, "function");
  assert.equal(typeof parentController.switchBackToParent, "function");
});

test("auth routes no longer reference the stale switch path, while parent routes keep the canonical endpoints", async () => {
  const authRoutesPath = path.join(backendRoot, "src", "routes", "auth.routes.js");
  const parentRoutesPath = path.join(
    backendRoot,
    "src",
    "routes",
    "parent.routes.js"
  );

  const [authRoutesSource, parentRoutesSource] = await Promise.all([
    fs.readFile(authRoutesPath, "utf8"),
    fs.readFile(parentRoutesPath, "utf8"),
  ]);

  assert.doesNotMatch(authRoutesSource, /switch-student/);
  assert.match(parentRoutesSource, /router\.post\("\/switch-to-student"/);
  assert.match(parentRoutesSource, /router\.post\("\/switch-back"/);
});

