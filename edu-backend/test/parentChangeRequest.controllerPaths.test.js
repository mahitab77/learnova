import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const parentControllerSource = readFileSync(
  new URL("../src/controllers/parent.controller.js", import.meta.url),
  "utf8"
);

function getBlock(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  assert.notEqual(start, -1, `Missing block start token: ${startToken}`);
  const end = source.indexOf(endToken, start);
  assert.notEqual(end, -1, `Missing block end token: ${endToken}`);
  return source.slice(start, end);
}

test("createParentRequest uses shared parent change-request insert helper", () => {
  const block = getBlock(
    parentControllerSource,
    "export const createParentRequest = async (req, res) => {",
    "export const createChangeRequest = async (req, res) => {"
  );
  assert.match(block, /insertParentTeacherChangeRequestHelper\s*\(/);
});

test("createChangeRequest uses shared parent change-request insert helper", () => {
  const block = getBlock(
    parentControllerSource,
    "export const createChangeRequest = async (req, res) => {",
    "export const getParentRequests = async (req, res) => {"
  );
  assert.match(block, /insertParentTeacherChangeRequestHelper\s*\(/);
});
