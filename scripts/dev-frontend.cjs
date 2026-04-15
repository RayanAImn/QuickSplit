const { spawn } = require("node:child_process");

const packageManagerExecPath = process.env.npm_execpath;
if (!packageManagerExecPath) {
  throw new Error("npm_execpath is required to run frontend dev.");
}

const command = process.execPath;
const child = spawn(command, [packageManagerExecPath, "--filter", "@workspace/quicksplit", "run", "dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.PORT ?? "5173",
    BASE_PATH: process.env.BASE_PATH ?? "/",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
