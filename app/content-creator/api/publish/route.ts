/**
 * POST /content-creator/api/publish — เผยแพร่ขึ้น Facebook (manual) [S4a→S4b]
 * body: { id } → publishApprovedPost (shared policy เดียวกับ scheduler [ตู๋ P1] ไม่ bypass)
 * นโยบาย (staleness guard / per-day fence / point-of-no-return) อยู่ใน publish-service
 */
import { NextResponse } from "next/server";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { fbPageId, fbPageToken } from "@/content-creator/lib/config";
import { publishApprovedPost } from "@/content-creator/publish-service";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ id: z.string().min(1) });

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี id)" }, { status: 400 });
  }

  const pageId = fbPageId();
  const token = fbPageToken();
  if (!pageId || !token) {
    return NextResponse.json({ ok: false, error: "FB env ไม่ครบ (CONTENT_FB_PAGE_ID/ACCESS_TOKEN)" }, { status: 500 });
  }

  const res = await publishApprovedPost(getContentDb(), body.id, { pageId, token });
  if (res.ok) return NextResponse.json({ ok: true, status: res.status, fbPostId: res.fbPostId }, { status: 200 });

  // map outcome → HTTP (shared policy)
  const httpByStatus = { SKIPPED: 409, STALE: 409, RETRYABLE: 502, AMBIGUOUS: 502 } as const;
  const ambiguous = res.status === "AMBIGUOUS";
  return NextResponse.json(
    { ok: false, status: ambiguous ? "PUBLISHING" : res.status, ambiguous: ambiguous || undefined, fbPostId: res.fbPostId, error: res.reason },
    { status: res.reason.includes("ไม่พบ") ? 404 : httpByStatus[res.status] },
  );
}
