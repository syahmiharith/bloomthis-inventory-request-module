import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
const nextBin = "./node_modules/next/dist/bin/next";

const server = spawn(
  process.execPath,
  [nextBin, "start", "--port", String(port)],
  {
    stdio: "inherit",
    shell: false,
  },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }
    await delay(500);
  }
  throw new Error("Timed out waiting for Next.js server.");
}

async function killServer() {
  if (server.exitCode !== null) {
    return;
  }
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
      shell: false,
    });
    return;
  }
  server.kill("SIGTERM");
}

try {
  await waitForServer();
  const runner = spawn(
    process.execPath,
    ["./node_modules/@playwright/test/cli.js", "test"],
    {
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: baseURL,
        PLAYWRIGHT_EXTERNAL_SERVER: "1",
      },
    },
  );

  const exitCode = await new Promise((resolve) => {
    runner.on("exit", (code) => resolve(code ?? 1));
  });
  await killServer();
  process.exit(exitCode);
} finally {
  await killServer();
}
