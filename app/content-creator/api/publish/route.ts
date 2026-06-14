/**
 * POST /content-creator/api/publish — เผยแพร่โพสต์ขึ้น Facebook เพจจริง (manual) [S4a]
 * body: { id } → claimForPublish (APPROVED→PUBLISHING) → upload media → publishToFeed → markPosted
 *
 * Carry-forward gates (ตู๋):
 *  - publishToFeed ล้ม = AMBIGUOUS (อาจโพสต์แล้ว response หาย) → **ไม่ releaseClaim** คง PUBLISHING
 *    ให้ reconcile มือ (กันโพสต์ซ้ำ) — ห้าม auto-release→APPROVED
 *  - ล้มก่อน publish (อ่าน image/upload) = ยังไม่โพสต์ → release→APPROVED ปลอดภัย (retry ได้)
 *  - mediaFbid reuse: upload สำเร็จแล้วเก็บไว้ → retry ไม่ upload ซ้ำ
 */
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { contentPosts } from "@/content-creator/db/schema";
import { claimForPublish, markPosted, releaseClaim } from "@/content-creator/db/transition";
import { uploadUnpublishedPhoto, publishToFeed } from "@/content-creator/lib/facebook";
import { safeResolveUnderRoot } from "@/content-creator/lib/safe-path";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { fbPageId, fbPageToken } from "@/content-creator/lib/config";

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

  const db = getContentDb();
  // preflight ก่อน claim — เช็ค row พร้อมจริง (กัน claim แล้วติด)
  const row = db.select().from(contentPosts).where(eq(contentPosts.id, body.id)).get();
  if (!row) return NextResponse.json({ ok: false, error: "ไม่พบโพสต์" }, { status: 404 });
  if (row.status !== "APPROVED") {
    return NextResponse.json({ ok: false, error: `ต้องเป็น APPROVED ก่อน publish (ปัจจุบัน ${row.status})` }, { status: 409 });
  }
  if (!row.caption || !row.imagePath) {
    return NextResponse.json({ ok: false, error: "โพสต์ไม่มี caption/image" }, { status: 409 });
  }

  // claim atomic (APPROVED→PUBLISHING) — worker เดียวยิง FB กัน concurrent post ซ้ำ
  if (!claimForPublish(db, body.id)) {
    return NextResponse.json({ ok: false, error: "claim ไม่ได้ (อาจถูกยิงอยู่/ไม่ใช่ APPROVED)" }, { status: 409 });
  }

  try {
    // upload media (idempotent: มี mediaFbid แล้ว reuse — ไม่ upload ซ้ำ)
    let mediaFbid = row.mediaFbid;
    if (!mediaFbid) {
      // อ่าน image ผ่าน util เดียวกัน (path-safe) — root=media dir, basename(imagePath) [S4a]
      const mediaDir = process.env.CONTENT_MEDIA_DIR || "content-creator/media";
      const real = safeResolveUnderRoot(mediaDir, basename(row.imagePath));
      if (!real) throw new Error(`image path ไม่ปลอดภัย/ไม่พบ: ${row.imagePath}`);
      const bytes = new Uint8Array(readFileSync(real));
      mediaFbid = await uploadUnpublishedPhoto({ pageId, token, bytes }); // published=false (ยังไม่โผล่)
      db.update(contentPosts)
        .set({ mediaFbid, updatedAt: new Date() })
        .where(and(eq(contentPosts.id, body.id), eq(contentPosts.status, "PUBLISHING")))
        .run();
    }

    // publish ขึ้น feed (โผล่เพจจริง) — lib maxRetries:0 กันโพสต์ซ้ำ
    let postId: string;
    try {
      postId = await publishToFeed({ pageId, token, mediaFbid, message: row.caption });
    } catch (pubErr) {
      // AMBIGUOUS — publish ล้ม/กำกวม อาจโพสต์สำเร็จแล้ว: คง PUBLISHING ไม่ release (กันโพสต์ซ้ำ) [ตู๋ gate]
      return NextResponse.json(
        {
          ok: false,
          ambiguous: true,
          status: "PUBLISHING",
          error: `publish กำกวม — เช็คเพจว่าขึ้นไหม. ค้าง PUBLISHING ไว้ (ไม่ release กันโพสต์ซ้ำ) ต้อง reconcile มือ: ${pubErr instanceof Error ? pubErr.message : String(pubErr)}`,
        },
        { status: 502 },
      );
    }

    markPosted(db, body.id, postId); // PUBLISHING→POSTED + fbPostId
    return NextResponse.json({ ok: true, status: "POSTED", fbPostId: postId });
  } catch (err) {
    // ล้มก่อน publish (อ่าน image/upload) = ยังไม่โพสต์ → release→APPROVED ปลอดภัย (retry ได้)
    releaseClaim(db, body.id, "APPROVED");
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
