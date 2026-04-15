const { spawn } = require("node:child_process");
const { withLoadedEnv } = require("./load-env.cjs");

const packageManagerExecPath = process.env.npm_execpath;
if (!packageManagerExecPath) {
  throw new Error("npm_execpath is required to run workspace dev commands.");
}

const command = process.execPath;
const children = [];
let isShuttingDown = false;

function spawnDevProcess(args, env) {
  const child = spawn(command, [packageManagerExecPath, ...args], {
    stdio: "inherit",
    env: {
      ...process.env,
      ...env,
    },
  });

  children.push(child);
  return child;
}

const frontend = spawnDevProcess(
  ["--filter", "@workspace/quicksplit", "run", "dev"],
  withLoadedEnv({
    PORT: process.env.FRONTEND_PORT ?? "5173",
    BASE_PATH: process.env.BASE_PATH ?? "/",
  }),
);

const apiEnv = withLoadedEnv({
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.API_PORT ?? "3000",
});

if (!apiEnv.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Set DATABASE_URL or SUPABASE_DB_URL in .env.");
  process.exit(1);
}

const api = spawnDevProcess(
  ["--filter", "@workspace/api-server", "run", "dev"],
  apiEnv,
);

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(exitCode);
}

frontend.on("exit", (code) => shutdown(code ?? 0));
api.on("exit", (code) => shutdown(code ?? 0));

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
