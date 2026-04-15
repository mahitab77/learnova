import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

function fail(message) {
  console.error(`[verify-db-invariants] ${message}`);
  process.exit(1);
}

function toSignature(rows) {
  return new Set(
    rows.map((row) => `${row.TABLE_NAME}:${row.NON_UNIQUE}:${String(row.COLS).toLowerCase()}`)
  );
}

async function main() {
  const database = process.env.DB_NAME || "edu_platform";
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database,
  });

  try {
    const [indexRows] = await connection.query(
      `
      SELECT
        TABLE_NAME,
        INDEX_NAME,
        NON_UNIQUE,
        GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') AS COLS
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN ('parent_students', 'student_teacher_selections')
      GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
      `,
      [database]
    );

    const signatures = toSignature(indexRows);
    const required = [
      "parent_students:0:parent_id,student_id",
      "student_teacher_selections:0:student_id,subject_id",
    ];
    for (const sig of required) {
      if (!signatures.has(sig)) {
        fail(`Missing required unique invariant (${sig}).`);
      }
    }

    console.log("[verify-db-invariants] OK");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  fail(err?.message || "Unexpected error.");
});
