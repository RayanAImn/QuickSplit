const { spawn } = require("node:child_process");
const { withLoadedEnv } = require("./load-env.cjs");

const packageManagerExecPath = process.env.npm_execpath;
if (!packageManagerExecPath) {
  throw new Error("npm_execpath is required to run api dev.");
}

const command = process.execPath;
const env = withLoadedEnv({
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.PORT ?? "3000",
});

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Set DATABASE_URL or SUPABASE_DB_URL in .env.");
  process.exit(1);
}

const child = spawn(command, [packageManagerExecPath, "--filter", "@workspace/api-server", "run", "dev"], {
  stdio: "inherit",
  env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
