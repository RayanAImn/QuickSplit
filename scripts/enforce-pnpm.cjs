const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const npmLockPath = path.join(rootDir, "package-lock.json");
const yarnLockPath = path.join(rootDir, "yarn.lock");

for (const lockFilePath of [npmLockPath, yarnLockPath]) {
  try {
    if (fs.existsSync(lockFilePath)) {
      fs.rmSync(lockFilePath, { force: true });
    }
  } catch (error) {
    console.warn(`[enforce-pnpm] Failed to remove ${path.basename(lockFilePath)}: ${error.message}`);
  }
}

const userAgent = process.env.npm_config_user_agent ?? "";
if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead of npm/yarn for this workspace.");
  process.exit(1);
}
