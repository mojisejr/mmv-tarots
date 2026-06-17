/**
 * POST /content-creator/api/cards/draft/:id/finalize — snapshot → contentPost → generate (hybrid) [PR#103]
 * body: { finalizeKey, expectedRevision } (ไม่มี backgroundId — hybrid ใช้ AI scene)
 * 1) finalize: persist cardIds+quote+body → contentPost PENDING (atomic)
 * 2) generate: AI scene + composition (ไพ่จริง+ข้อความ) → GENERATED → โผล่คิวโพสต์มือ (#100)
 *    classify ตาม status จริง [ตู๋ P1] — replay หลัง response หายอาจ GENERATING/FAILED
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { finalizeRandomCardsDraft } from "@/content-creator/random-cards-service";
import { draftErrorStatus, classifyFinalizeStatus } from "@/content-creator/daily7-service";
import { generate } from "@/content-creator/engine";
import { contentPosts } from "@/content-creator/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ finalizeKey: z.string().min(1), expectedRevision: z.number().int().min(0) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี finalizeKey + expectedRevision)" }, { status: 400 });
  }

  const db = getContentDb();
  let contentPostId: string;
  try {
    contentPostId = finalizeRandomCardsDraft(db, id, body.finalizeKey, body.expectedRevision).contentPostId;
  } catch (e) {
    const { status, error } = draftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }

  const gen = await generate(db, contentPostId);
  const post = db.select().from(contentPosts).where(eq(contentPosts.id, contentPostId)).get();
  const status = post?.status ?? "PENDING";
  const c = classifyFinalizeStatus(status);
  return NextResponse.json(
    { ok: c.ok, definitive: c.definitive, contentPostId, status, caption: post?.caption ?? gen.caption, error: gen.error },
    { status: c.http },
  );
}
