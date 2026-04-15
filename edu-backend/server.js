// server.js
import app from "./src/app.js";
import { testDbConnection } from "./src/db.js";
import { closeDbPool } from "./src/db.js";
import { checkCriticalSchemaInvariants } from "./src/db.js";
import { validateProductionEnv } from "./src/config/envValidation.js";
import { logError, logInfo, toStructuredError } from "./src/utils/observability.js";

const PORT = process.env.PORT || 5000;
let server = null;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  logInfo("server.shutdown_started", {
    signal,
    env: process.env.NODE_ENV || "development",
  });

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDbPool();
    logInfo("server.shutdown_completed", { signal });
    process.exit(0);
  } catch (err) {
    logError("server.shutdown_failed", {
      signal,
      error: toStructuredError(err),
    });
    process.exit(1);
  }
}

async function start() {
  validateProductionEnv();

  // optional: test DB before starting
  await testDbConnection();
  const schemaInvariantsReady = await checkCriticalSchemaInvariants();
  if (!schemaInvariantsReady) {
    throw new Error(
      "Critical schema invariants are missing. Required unique keys include student_teacher_selections(student_id, subject_id) and parent_students(parent_id, student_id)."
    );
  }

  server = app.listen(PORT, () => {
    logInfo("server.started", {
      port: Number(PORT),
      host: "localhost",
      env: process.env.NODE_ENV || "development",
    });
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

start().catch((err) => {
  logError("server.start_failed", {
    error: toStructuredError(err),
  });
  process.exit(1);
});
