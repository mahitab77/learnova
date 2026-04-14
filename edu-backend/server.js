// server.js
import app from "./src/app.js";
import { testDbConnection } from "./src/db.js";
import { validateProductionEnv } from "./src/config/envValidation.js";
import { logError, logInfo, toStructuredError } from "./src/utils/observability.js";

const PORT = process.env.PORT || 5000;

async function start() {
  validateProductionEnv();

  // optional: test DB before starting
  await testDbConnection();

  app.listen(PORT, () => {
    logInfo("server.started", {
      port: Number(PORT),
      host: "localhost",
      env: process.env.NODE_ENV || "development",
    });
  });
}

start().catch((err) => {
  logError("server.start_failed", {
    error: toStructuredError(err),
  });
  process.exit(1);
});
