import { NextResponse } from "next/server";
import type { ContentDraft } from "@/content-creator/db/schema";

export function draftRouteResponse(draft: ContentDraft) {
  if (draft.status === "FAILED") {
    return NextResponse.json(
      {
        ok: false,
        definitive: true,
        status: "FAILED",
        error: draft.error ?? "draft generation failed",
        draft,
      },
      { status: 200 },
    );
  }
  return NextResponse.json({ ok: true, status: draft.status, draft }, { status: 200 });
}
