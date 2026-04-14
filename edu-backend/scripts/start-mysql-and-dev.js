// scripts/start-mysql-and-dev.js
// ---------------------------------------------------------
// Starts XAMPP MySQL in the background, waits a bit,
// then runs `nodemon server.js`.
// ---------------------------------------------------------

import { spawn } from "child_process";

function startXamppMySQL() {
  return new Promise((resolve) => {
    // 🔧 Adjust this path if your XAMPP is somewhere else
    const mysqlStartBat = "D:\\xampp\\mysql_start.bat";

    console.log("🚀 Starting MySQL via XAMPP in the background...");

    // Launch the batch file in a separate process and don't wait for it
    const child = spawn("cmd.exe", ["/c", "start", "", mysqlStartBat], {
      detached: true,
      stdio: "ignore", // don't tie our Node process to this console
    });

    // Allow Node to exit even if this child is still running
    child.unref();

    // Give MySQL a few seconds to spin up
    const delayMs = 4000;
    console.log(`⏳ Waiting ${delayMs / 1000} seconds for MySQL to start...`);

    setTimeout(() => {
      console.log("✅ Proceeding to start the dev server (MySQL should be starting or already running).");
      resolve();
    }, delayMs);
  });
}

async function main() {
  await startXamppMySQL();

  console.log("▶️ Starting nodemon dev server...");
  const dev = spawn("npx", ["nodemon", "server.js"], {
    stdio: "inherit",
    shell: true,
  });

  dev.on("close", (code) => {
    console.log(`👋 Dev server exited with code ${code}`);
    process.exit(code);
  });
}

main().catch((err) => {
  console.error("💥 Failed to start dev environment:", err);
  process.exit(1);
});
