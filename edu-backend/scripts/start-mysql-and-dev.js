// scripts/start-mysql-and-dev.js
// ---------------------------------------------------------
// Starts XAMPP MySQL in the background, waits a bit,
// then runs `nodemon server.js`.
// ---------------------------------------------------------

import { spawn } from "child_process";
import { existsSync } from "fs";
import net from "net";

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPortOpen({ host, port, timeoutMs = 1000 }) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

async function waitForMySQL({
  host,
  port,
  retries = 30,
  retryDelayMs = 1000,
}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const ready = await isPortOpen({ host, port, timeoutMs: retryDelayMs });
    if (ready) return true;

    if (attempt < retries) {
      console.log(
        `⏳ Waiting for MySQL on ${host}:${port} (attempt ${attempt}/${retries})...`
      );
      await delay(retryDelayMs);
    }
  }

  return false;
}

async function startXamppMySQL() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = toInt(process.env.DB_PORT, 3306);
  const mysqlStartBat = process.env.XAMPP_MYSQL_START_BAT || "D:\\xampp\\mysql_start.bat";

  const alreadyRunning = await isPortOpen({ host, port, timeoutMs: 800 });
  if (alreadyRunning) {
    console.log(`✅ MySQL already running on ${host}:${port}.`);
    return;
  }

  if (!existsSync(mysqlStartBat)) {
    throw new Error(
      `XAMPP MySQL start script not found at "${mysqlStartBat}". Set XAMPP_MYSQL_START_BAT in .env.`
    );
  }

  console.log(`🚀 Starting MySQL via XAMPP in the background (${mysqlStartBat})...`);

  // Launch the batch file in a separate process and don't wait for it
  const child = spawn("cmd.exe", ["/c", "start", "", mysqlStartBat], {
    detached: true,
    stdio: "ignore",
  });

  // Allow Node to exit even if this child is still running
  child.unref();

  const ready = await waitForMySQL({
    host,
    port,
    retries: toInt(process.env.DB_BOOT_RETRIES, 45),
    retryDelayMs: toInt(process.env.DB_BOOT_RETRY_DELAY_MS, 1000),
  });

  if (!ready) {
    throw new Error(
      `MySQL did not open ${host}:${port} in time. Start MySQL manually (XAMPP Control Panel) and re-run npm run dev.`
    );
  }

  console.log(`✅ MySQL is reachable on ${host}:${port}.`);
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
