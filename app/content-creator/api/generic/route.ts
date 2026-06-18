/**
 * POST /content-creator/api/generic — Phase C generic content engine (simple-sync + internal draft fence)
 * body: { requestKey, type }
 *   1. createGenericDraft: createDraft(fence) → resolve content (paid genObject **หลัง fresh+token เท่านั้น**)
 *   2. READY → finalizeGenericDraft (server finalizeKey `gen:<draftId>`) → contentPost PENDING
 *   3. generate (engine เดิม, sync) → GENERATED → คิว approve
 *   4. classify ตาม contentPost.status จริง [§1.1] — FINALIZED ไม่เหมา success
 *
 * idempotent: requestKey เดิม + type ตรง → ไม่จ่าย genObject/caption ซ้ำทุก path (retry/reload/concurrent).
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { contentPosts, type ContentStatus } from "@/content-creator/db/schema";
import { generate } from "@/content-creator/engine";
import {
  createGenericDraft,
  finalizeGenericDraft,
  genericDraftErrorStatus,
  classifyGenericStatus,
  isStaleGenerating,
  draftLowConf,
} from "@/content-creator/generic-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  requestKey: z.string().min(1),
  type: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี requestKey + type)" }, { status: 400 });
  }

  const db = getContentDb();

  // 1) draft fence + resolve (paid genObject อยู่หลัง fresh+token ภายใน)
  let draft;
  try {
    draft = await createGenericDraft(db, body.requestKey, body.type);
  } catch (e) {
    const { status, error } = genericDraftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }

  const lowConf = draftLowConf(draft);

  // GENERATING = concurrent in-flight (อีก request กำลัง resolve) หรือ stale (process ตาย) → 202 ไม่จ่ายซ้ำ
  if (draft.status === "GENERATING") {
    return NextResponse.json(
      { ok: false, definitive: false, inProgress: true, draftId: draft.id, status: "GENERATING", stale: isStaleGenerating(draft), lowConf },
      { status: 202 },
    );
  }
  // FAILED = resolve ล้ม (gibberish/schema หลัง repair) → definitive, client เริ่มใหม่ key ใหม่
  if (draft.status === "FAILED") {
    return NextResponse.json(
      { ok: false, definitive: true, draftId: draft.id, status: "FAILED", error: draft.error ?? "resolve ล้ม", lowConf },
      { status: 502 },
    );
  }

  // READY → finalize ; FINALIZED → replay (post มีแล้ว) — converge ไป generate+classify
  let contentPostId: string;
  if (draft.status === "READY") {
    try {
      contentPostId = finalizeGenericDraft(db, draft.id, `gen:${draft.id}`, draft.revision).contentPostId;
    } catch (e) {
      const { status, error } = genericDraftErrorStatus(e);
      return NextResponse.json({ ok: false, error, draftId: draft.id }, { status });
    }
  } else if (draft.status === "FINALIZED" && draft.contentPostId) {
    contentPostId = draft.contentPostId;
  } else {
    return NextResponse.json({ ok: false, error: `draft status ไม่คาดคิด: ${draft.status}`, draftId: draft.id }, { status: 500 });
  }

  // generate (replay-safe: SKIPPED ถ้าไม่ใช่ PENDING แล้ว → ไม่จ่าย caption ซ้ำ) → classify ตาม status จริง
  const gen = await generate(db, contentPostId);
  const post = db.select().from(contentPosts).where(eq(contentPosts.id, contentPostId)).get();
  const status = (post?.status ?? "PENDING") as ContentStatus;
  const c = classifyGenericStatus(status);
  return NextResponse.json(
    {
      ok: c.ok,
      definitive: c.definitive,
      inProgress: !c.definitive,
      draftId: draft.id,
      id: contentPostId,
      status,
      caption: post?.caption ?? gen.caption ?? undefined,
      lowConf,
      error: c.ok ? undefined : gen.error ?? (status === "FAILED" ? "gen ล้ม" : undefined),
    },
    { status: c.http },
  );
}
