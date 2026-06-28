import { accessSync, constants, existsSync, statSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { sql } from "drizzle-orm";
import type { ContentDb } from "./db/client";
import { contentPosts } from "./db/schema";
import { getBrandProfile } from "./db/brand";
import { countApproved } from "./scene-pool";
import { listTemplateIds } from "./templates";
import { safeResolveUnderRoot } from "./lib/safe-path";
import { IMAGE_MODEL, REF_IMAGE_MODEL, TEXT_MODEL } from "./lib/config";

export type ReadinessStatus = "pass" | "warn" | "fail";

export interface ReadinessCheck {
  id: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
}

export interface ContentCreatorReadiness {
  ok: boolean;
  status: ReadinessStatus;
  checkedAt: string;
  summary: { pass: number; warn: number; fail: number };
  checks: ReadinessCheck[];
  facts: {
    templateCount: number;
    approvedScenes: number;
    textModel: string;
    imageModel: string;
    refImageModel: string;
  };
}

interface EnvLike {
  [key: string]: string | undefined;
}

function check(id: string, label: string, status: ReadinessStatus, detail: string): ReadinessCheck {
  return { id, label, status, detail };
}

function apiKeyReady(value: string | undefined): boolean {
  return !!value && !/^(local-|your-|change-me|placeholder)/i.test(value);
}

function isLocalDatabaseUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  } catch {
    return false;
  }
}

function mediaDirCheck(env: EnvLike, cwd: string): ReadinessCheck {
  const configured = env.CONTENT_MEDIA_DIR || "content-creator/media";
  const dir = isAbsolute(configured) ? configured : resolve(cwd, configured);
  if (existsSync(dir)) {
    try {
      const stat = statSync(dir);
      if (!stat.isDirectory()) return check("media-dir", "Media directory", "fail", "CONTENT_MEDIA_DIR exists but is not a directory");
      accessSync(dir, constants.R_OK | constants.W_OK);
      return check("media-dir", "Media directory", "pass", "media directory exists and is readable/writable");
    } catch (e) {
      return check("media-dir", "Media directory", "fail", `media directory is not accessible: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  try {
    accessSync(dirname(dir), constants.R_OK | constants.W_OK);
    return check("media-dir", "Media directory", "warn", "media directory is missing, but parent is writable and generation can create it");
  } catch {
    return check("media-dir", "Media directory", "fail", "media directory is missing and parent is not writable");
  }
}

export function inspectContentCreatorReadiness(db: ContentDb, env: EnvLike = process.env, cwd = process.cwd()): ContentCreatorReadiness {
  const checks: ReadinessCheck[] = [];
  const templates = listTemplateIds();
  const brand = getBrandProfile(db);
  const approvedScenes = countApproved(db);

  db.select({ n: sql<number>`count(*)` }).from(contentPosts).get();
  checks.push(check("content-db", "Content SQLite DB", "pass", "content DB opened and schema query succeeded"));

  checks.push(
    check(
      "app-db-url",
      "App DATABASE_URL",
      isLocalDatabaseUrl(env.DATABASE_URL) ? "pass" : "fail",
      isLocalDatabaseUrl(env.DATABASE_URL) ? "DATABASE_URL points to local Postgres" : "DATABASE_URL is missing or not local",
    ),
  );

  checks.push(
    check(
      "google-api-key",
      "Gemini API key",
      apiKeyReady(env.GOOGLE_GENERATIVE_AI_API_KEY) ? "pass" : "fail",
      apiKeyReady(env.GOOGLE_GENERATIVE_AI_API_KEY) ? "configured (value hidden)" : "missing or placeholder",
    ),
  );

  checks.push(
    check(
      "models",
      "Content models",
      env.CONTENT_TEXT_MODEL && env.CONTENT_IMAGE_MODEL && env.CONTENT_REF_IMAGE_MODEL ? "pass" : "warn",
      `text=${TEXT_MODEL}, image=${IMAGE_MODEL}, ref=${REF_IMAGE_MODEL}`,
    ),
  );

  checks.push(mediaDirCheck(env, cwd));

  checks.push(
    check(
      "brand-cta",
      "Brand CTA URL",
      brand.ctaUrl.trim() ? "pass" : "fail",
      brand.ctaUrl.trim() ? "ctaUrl is set for caption validation" : "ctaUrl is empty; generation fails before paid calls",
    ),
  );

  checks.push(
    check(
      "brand-ref",
      "Brand reference image",
      brand.refImagePath && safeResolveUnderRoot(cwd, brand.refImagePath) ? "pass" : "warn",
      brand.refImagePath && safeResolveUnderRoot(cwd, brand.refImagePath) ? "reference image exists and is safe" : "reference image is missing or unsafe",
    ),
  );

  checks.push(
    check(
      "approved-scenes",
      "Approved scenes",
      approvedScenes > 0 ? "pass" : "warn",
      approvedScenes > 0 ? `${approvedScenes} approved scene(s) available for random-cards` : "no approved scenes; random-cards finalize will fail before paid caption",
    ),
  );

  checks.push(
    check(
      "templates",
      "Templates",
      templates.length > 0 ? "pass" : "fail",
      `${templates.length} template(s): ${templates.join(", ")}`,
    ),
  );

  const summary = checks.reduce(
    (acc, c) => {
      acc[c.status] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 },
  );
  const status: ReadinessStatus = summary.fail > 0 ? "fail" : summary.warn > 0 ? "warn" : "pass";

  return {
    ok: status !== "fail",
    status,
    checkedAt: new Date().toISOString(),
    summary,
    checks,
    facts: {
      templateCount: templates.length,
      approvedScenes,
      textModel: TEXT_MODEL,
      imageModel: IMAGE_MODEL,
      refImageModel: REF_IMAGE_MODEL,
    },
  };
}
