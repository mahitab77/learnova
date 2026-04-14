import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function collectJsFiles(startPath, out) {
  if (!existsSync(startPath)) return;
  const entries = readdirSync(startPath);
  for (const entry of entries) {
    const fullPath = join(startPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      collectJsFiles(fullPath, out);
      continue;
    }
    if (entry.endsWith(".js")) out.push(fullPath);
  }
}

const targets = [];
collectJsFiles("src", targets);
if (existsSync("server.js")) targets.push("server.js");
if (existsSync("test")) collectJsFiles("test", targets);
if (existsSync("scripts")) collectJsFiles("scripts", targets);

if (!targets.length) {
  console.log("[lint-backend] No JS files found.");
  process.exit(0);
}

const check = spawnSync(process.execPath, ["--check", ...targets], {
  stdio: "inherit",
});

if (check.status !== 0) {
  process.exit(check.status ?? 1);
}

console.log(`[lint-backend] Syntax check passed for ${targets.length} files.`);
