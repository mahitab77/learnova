import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = "scripts/migrations";
const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));
const CRITICAL_INVARIANT_MIGRATION = "006_enforce_linkage_and_selection_invariants.sql";

if (!files.length) {
  console.error("[validate-migrations] No migration files found.");
  process.exit(1);
}

if (!files.includes(CRITICAL_INVARIANT_MIGRATION)) {
  console.error(
    `[validate-migrations] Missing critical migration: ${CRITICAL_INVARIANT_MIGRATION}`
  );
  process.exit(1);
}

const prefixMap = new Map();
let hasErrors = false;

for (const file of files) {
  const match = file.match(/^(\d+)_/);
  if (!match) {
    console.error(`[validate-migrations] Invalid migration filename format: ${file}`);
    hasErrors = true;
    continue;
  }
  const prefix = match[1];
  if (prefixMap.has(prefix)) {
    console.error(
      `[validate-migrations] Duplicate migration prefix ${prefix}: ${prefixMap.get(prefix)} and ${file}`
    );
    hasErrors = true;
  } else {
    prefixMap.set(prefix, file);
  }

  const sql = readFileSync(join(migrationsDir, file), "utf8");
  const hasCreateIndex = /CREATE\s+INDEX/i.test(sql);
  const hasIfNotExists = /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/i.test(sql);
  const hasSchemaGuard =
    /information_schema\.STATISTICS/i.test(sql) ||
    /ADD\s+KEY/i.test(sql) ||
    /ALTER\s+TABLE[\s\S]*ADD\s+KEY/i.test(sql);

  if (hasCreateIndex && !hasIfNotExists && !hasSchemaGuard) {
    console.error(
      `[validate-migrations] Non-idempotent CREATE INDEX detected in ${file}. Add IF NOT EXISTS or information_schema guards.`
    );
    hasErrors = true;
  }

  if (file === CRITICAL_INVARIANT_MIGRATION) {
    const requiredTokens = [
      "uq_parent_students_parent_student",
      "uq_student_teacher_selection",
      "fk_parent_students_parent",
      "fk_parent_students_student",
    ];
    for (const token of requiredTokens) {
      if (!sql.includes(token)) {
        console.error(
          `[validate-migrations] Critical migration ${file} is missing required token: ${token}`
        );
        hasErrors = true;
      }
    }
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log(`[validate-migrations] OK (${files.length} migration files checked).`);
