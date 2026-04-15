const fs = require("node:fs");
const path = require("node:path");

function parseEnvFile(content) {
  const parsed = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const quoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"));
    const value = quoted ? rawValue.slice(1, -1) : rawValue;

    parsed[key] = value;
  }

  return parsed;
}

function loadEnvFromRoot() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const content = fs.readFileSync(envPath, "utf8");
  return parseEnvFile(content);
}

function withLoadedEnv(overrides = {}) {
  const fileEnv = loadEnvFromRoot();
  const merged = {
    ...fileEnv,
    ...process.env,
    ...overrides,
  };

  if (!merged.DATABASE_URL && merged.SUPABASE_DB_URL) {
    merged.DATABASE_URL = merged.SUPABASE_DB_URL;
  }

  return merged;
}

module.exports = {
  withLoadedEnv,
};
