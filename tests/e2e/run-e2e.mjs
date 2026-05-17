import { spawn, spawnSync } from "node:child_process";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const isWindows = process.platform === "win32";
const nextCommand = isWindows
  ? "node_modules\\.bin\\next.cmd"
  : "node_modules/.bin/next";
let server;

try {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    run("npm", ["run", "db:migrate"]);
    run("npm", ["run", "db:seed"]);
    server = spawn(nextCommand, ["dev", "-p", "3100"], {
      shell: isWindows,
      stdio: "inherit",
    });
    await waitForServer(baseURL);
  }

  const result = spawnSync(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test"],
    {
      env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL },
      stdio: "inherit",
    },
  );
  process.exitCode = result.status ?? 1;
} finally {
  if (server) {
    stopProcessTree(server.pid);
  }
}

process.exit(process.exitCode ?? 0);

function run(command, args) {
  const result = spawnSync(command, args, {
    shell: true,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function waitForServer(url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 120_000) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        await response.body?.cancel();
        return;
      }
      await response.body?.cancel();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function stopProcessTree(pid) {
  if (!pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }

  process.kill(pid, "SIGTERM");
}
