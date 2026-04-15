const { spawn } = require("node:child_process");

const packageManagerExecPath = process.env.npm_execpath;
if (!packageManagerExecPath) {
  throw new Error("npm_execpath is required to run api dev.");
}

const command = process.execPath;
const child = spawn(command, [packageManagerExecPath, "--filter", "@workspace/api-server", "run", "dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: process.env.PORT ?? "3000",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
