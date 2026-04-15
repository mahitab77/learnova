import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

function sqlForTable(tableName, columns, indexes) {
  const columnLines = columns.map((col) => {
    const nullable = col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL";
    const type = col.COLUMN_TYPE;
    const defaultExpr =
      col.COLUMN_DEFAULT == null
        ? ""
        : ` DEFAULT ${col.COLUMN_DEFAULT === "CURRENT_TIMESTAMP" ? "CURRENT_TIMESTAMP" : `'${String(col.COLUMN_DEFAULT).replace(/'/g, "''")}'`}`;
    const extra = col.EXTRA ? ` ${col.EXTRA.toUpperCase()}` : "";
    return `  \`${col.COLUMN_NAME}\` ${type} ${nullable}${defaultExpr}${extra}`.trimEnd();
  });

  const indexLines = indexes.map((idx) => {
    const cols = idx.COLS.split(",").map((c) => `\`${c}\``).join(", ");
    if (idx.INDEX_NAME === "PRIMARY") return `  PRIMARY KEY (${cols})`;
    if (idx.NON_UNIQUE === 0) return `  UNIQUE KEY \`${idx.INDEX_NAME}\` (${cols})`;
    return `  KEY \`${idx.INDEX_NAME}\` (${cols})`;
  });

  return [
    `-- ${tableName}`,
    `DROP TABLE IF EXISTS \`${tableName}\`;`,
    `CREATE TABLE \`${tableName}\` (`,
    [...columnLines, ...indexLines].join(",\n"),
    ");",
    "",
  ].join("\n");
}

async function main() {
  const database = process.env.DB_NAME || "edu_platform";
  const outPath = resolve("schema", "edu_platform_schema.snapshot.sql");
  mkdirSync(dirname(outPath), { recursive: true });

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database,
  });

  try {
    const [tables] = await conn.query(
      `
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME ASC
      `,
      [database]
    );

    const chunks = [
      "-- Generated schema snapshot",
      `-- Database: ${database}`,
      `-- Generated at: ${new Date().toISOString()}`,
      "",
    ];

    for (const tableRow of tables) {
      const tableName = tableRow.TABLE_NAME;
      const [columns] = await conn.query(
        `
        SELECT
          COLUMN_NAME,
          COLUMN_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          EXTRA
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION ASC
        `,
        [database, tableName]
      );
      const [indexes] = await conn.query(
        `
        SELECT
          INDEX_NAME,
          NON_UNIQUE,
          GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') AS COLS
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
        GROUP BY INDEX_NAME, NON_UNIQUE
        ORDER BY INDEX_NAME ASC
        `,
        [database, tableName]
      );

      chunks.push(sqlForTable(tableName, columns, indexes));
    }

    writeFileSync(outPath, chunks.join("\n"), "utf8");
    console.log(`[export-schema-snapshot] Wrote ${outPath}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(`[export-schema-snapshot] ${err?.message || "Unexpected error."}`);
  process.exit(1);
});
