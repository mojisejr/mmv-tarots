#!/usr/bin/env node

const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const nvmrcPath = path.join(root, ".nvmrc");
const errors = [];
const warnings = [];

function parseEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function checkPort(hostname, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: hostname, port, timeout: 1200 }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

async function main() {
  const requiredNode = fs.existsSync(nvmrcPath) ? fs.readFileSync(nvmrcPath, "utf8").trim() : "22";
  const major = Number(process.versions.node.split(".")[0]);
  if (major !== 22) {
    fail(`Node ${process.version} is active, but content-creator native deps are pinned to ${requiredNode}. Run with Node 22 before starting dev.`);
  }

  try {
    require("better-sqlite3");
  } catch (e) {
    fail(`better-sqlite3 failed to load: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (!fs.existsSync(envPath)) {
    fail(".env.local is missing. Copy .env.example and fill local content-creator values.");
  }

  const localEnv = parseEnvFile(envPath);
  const rootEnv = parseEnvFile(path.join(root, ".env"));

  if (localEnv.CONTENT_CREATOR_ENABLED !== "true") fail("CONTENT_CREATOR_ENABLED=true is required in .env.local.");
  for (const key of ["CONTENT_DB_PATH", "CONTENT_MEDIA_DIR", "GOOGLE_GENERATIVE_AI_API_KEY"]) {
    if (!localEnv[key]) fail(`${key} is required in .env.local.`);
  }
  if (!localEnv.CONTENT_TEXT_MODEL) warn("CONTENT_TEXT_MODEL is not set; engine default will be used.");
  if (!localEnv.CONTENT_IMAGE_MODEL) warn("CONTENT_IMAGE_MODEL is not set; engine default will be used.");
  if (localEnv.GOOGLE_GENERATIVE_AI_API_KEY && /^(local-|your-|change-me|placeholder)/i.test(localEnv.GOOGLE_GENERATIVE_AI_API_KEY)) {
    fail("GOOGLE_GENERATIVE_AI_API_KEY in .env.local looks like a placeholder.");
  }

  if (!localEnv.DATABASE_URL) fail("DATABASE_URL is required in .env.local for the app/auth shell.");
  else {
    try {
      const dbUrl = new URL(localEnv.DATABASE_URL);
      if (!isLocalHost(dbUrl.hostname)) fail("DATABASE_URL in .env.local must point to local Postgres for local content-creator work.");
      const port = Number(dbUrl.port || 5432);
      if (isLocalHost(dbUrl.hostname) && !(await checkPort(dbUrl.hostname, port))) {
        fail(`local Postgres is not reachable at ${dbUrl.hostname}:${port}. Run npm run db:up before starting dev.`);
      }
    } catch {
      fail("DATABASE_URL in .env.local is not a valid URL.");
    }
  }
  if (rootEnv.DATABASE_URL && !rootEnv.DATABASE_URL.includes("localhost")) {
    warn(".env appears to point at a non-local database; Next should use .env.local overrides during local dev.");
  }

  const contentDbPath = localEnv.CONTENT_DB_PATH || "content-creator/content.db";
  const resolvedContentDbPath = path.isAbsolute(contentDbPath) ? contentDbPath : path.join(root, contentDbPath);
  if (!fs.existsSync(path.dirname(resolvedContentDbPath))) fail(`CONTENT_DB_PATH directory does not exist: ${path.dirname(resolvedContentDbPath)}`);

  const mediaDir = localEnv.CONTENT_MEDIA_DIR;
  if (mediaDir) {
    const resolvedMediaDir = path.isAbsolute(mediaDir) ? mediaDir : path.join(root, mediaDir);
    if (!fs.existsSync(resolvedMediaDir)) warn(`CONTENT_MEDIA_DIR does not exist yet: ${resolvedMediaDir}`);
  }

  for (const message of warnings) console.warn(`WARN ${message}`);
  if (errors.length) {
    for (const message of errors) console.error(`FAIL ${message}`);
    process.exit(1);
  }
  console.log("PASS content-creator preflight: Node 22, native SQLite, local env, and local Postgres are ready.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
