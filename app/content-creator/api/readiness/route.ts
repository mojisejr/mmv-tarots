/**
 * GET /content-creator/api/readiness — local readiness summary before paid generation.
 * Read-only: no Gemini/Facebook calls and no DB/FS mutation.
 */
import { NextResponse } from "next/server";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { inspectContentCreatorReadiness } from "@/content-creator/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  try {
    return NextResponse.json(inspectContentCreatorReadiness(getContentDb()));
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        status: "fail",
        checkedAt: new Date().toISOString(),
        summary: { pass: 0, warn: 0, fail: 1 },
        checks: [
          {
            id: "readiness",
            label: "Readiness check",
            status: "fail",
            detail: e instanceof Error ? e.message : String(e),
          },
        ],
        facts: { templateCount: 0, approvedScenes: 0, textModel: "", imageModel: "", refImageModel: "" },
      },
      { status: 200 },
    );
  }
}
