import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createContentDb } from "../db/client";
import { updateBrandProfile } from "../db/brand";
import { sceneLibrary } from "../db/schema";
import { inspectContentCreatorReadiness } from "../readiness";
import { GET as readinessGET } from "@/app/content-creator/api/readiness/route";

const dirs: string[] = [];

function tmp() {
  const dir = mkdtempSync(join(tmpdir(), "cc-ready-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  delete process.env.CONTENT_CREATOR_ENABLED;
  delete process.env.CONTENT_DB_PATH;
  delete process.env.CONTENT_MEDIA_DIR;
  delete process.env.DATABASE_URL;
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
});

describe("inspectContentCreatorReadiness", () => {
  it("PASS เมื่อ local env/db/brand/media/scenes พร้อม โดยไม่ยิง provider", () => {
    const dir = tmp();
    const media = join(dir, "media");
    mkdirSync(media);
    const db = createContentDb(join(dir, "content.db"));
    updateBrandProfile(db, { ctaUrl: "https://maemormimi.com/" });
    db.insert(sceneLibrary).values({ id: "s1", theme: "t", imagePath: "content-creator/brand/scenes/06fdd202-39dd-4eab-9477-355b06bd27cb.png", status: "APPROVED", genBatch: "b" }).run();

    const res = inspectContentCreatorReadiness(
      db,
      {
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/mmv_tarots_dev",
        GOOGLE_GENERATIVE_AI_API_KEY: "real-looking-key",
        CONTENT_MEDIA_DIR: media,
        CONTENT_TEXT_MODEL: "gemini-2.5-flash",
        CONTENT_IMAGE_MODEL: "gemini-2.5-flash-image",
        CONTENT_REF_IMAGE_MODEL: "gemini-2.5-flash-image",
      },
      process.cwd(),
    );

    expect(res.status).toBe("pass");
    expect(res.ok).toBe(true);
    expect(res.summary.fail).toBe(0);
    expect(res.facts.approvedScenes).toBe(1);
    expect(res.checks.find((c) => c.id === "google-api-key")?.detail).toBe("configured (value hidden)");
  });

  it("FAIL/WARN เมื่อ env สำคัญหรือ CTA ยังไม่พร้อม", () => {
    const dir = tmp();
    const db = createContentDb(join(dir, "content.db"));
    const res = inspectContentCreatorReadiness(
      db,
      {
        DATABASE_URL: "postgresql://user:pass@example.neon.tech/db",
        GOOGLE_GENERATIVE_AI_API_KEY: "local-google-generative-ai-key",
        CONTENT_MEDIA_DIR: join(dir, "missing", "media"),
      },
      process.cwd(),
    );

    expect(res.status).toBe("fail");
    expect(res.ok).toBe(false);
    expect(res.checks.find((c) => c.id === "app-db-url")?.status).toBe("fail");
    expect(res.checks.find((c) => c.id === "google-api-key")?.status).toBe("fail");
    expect(res.checks.find((c) => c.id === "brand-cta")?.status).toBe("fail");
    expect(res.checks.find((c) => c.id === "approved-scenes")?.status).toBe("warn");
  });

  it("route เปิด feature → 200 summary, ปิด feature → 404", async () => {
    const dir = tmp();
    mkdirSync(join(dir, "media"));
    process.env.CONTENT_CREATOR_ENABLED = "true";
    process.env.CONTENT_DB_PATH = join(dir, "route.db");
    process.env.CONTENT_MEDIA_DIR = join(dir, "media");
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/mmv_tarots_dev";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "real-looking-key";

    const res = await readinessGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks.map((c: { id: string }) => c.id)).toContain("content-db");

    process.env.CONTENT_CREATOR_ENABLED = "false";
    expect((await readinessGET()).status).toBe(404);
  });
});
