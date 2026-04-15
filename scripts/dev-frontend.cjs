const { spawn } = require("node:child_process");
const { withLoadedEnv } = require("./load-env.cjs");

const packageManagerExecPath = process.env.npm_execpath;
if (!packageManagerExecPath) {
  throw new Error("npm_execpath is required to run frontend dev.");
}

const command = process.execPath;
const env = withLoadedEnv({
  PORT: process.env.PORT ?? "5173",
  BASE_PATH: process.env.BASE_PATH ?? "/",
});

const child = spawn(command, [packageManagerExecPath, "--filter", "@workspace/quicksplit", "run", "dev"], {
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
