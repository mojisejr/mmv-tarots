"use client";

/**
 * /content-creator — manual workflow UI (admin tool ของฟีม) [S3 / PR#100]
 * แสดงโพสต์ที่ gen เสร็จ (GENERATED) → ฟีม copy caption + โหลดรูป → โพสต์ FB เอง → กด "โพสต์แล้ว"/"ลบ".
 * (auto approve→publish เก็บ code ไว้แต่ไม่ใช้ใน UX นี้ — Meta App Review ตัน สำหรับ no-company)
 * route ถูก guard ด้วย middleware (404 ถ้า CONTENT_CREATOR_ENABLED ไม่เปิด/บน production)
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Post = {
  id: string;
  templateId: string;
  status: string;
  caption: string | null;
  inputData: Record<string, unknown>;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-gray-200 text-gray-700",
  GENERATING: "bg-amber-100 text-amber-800",
  GENERATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  PUBLISHING: "bg-amber-100 text-amber-800",
  POSTED: "bg-green-600 text-white",
  CANCELED: "bg-gray-300 text-gray-600",
  FAILED: "bg-red-100 text-red-800",
};

export default function ContentCreatorPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // daily-7 scheduler status (modal/banner แจ้งเตือน) [S4b]
  const [d7, setD7] = useState<{ today: string; posted: boolean; pending: number; staleCanceled: number; stuckPublishing: number } | null>(null);
  const [d7Dismissed, setD7Dismissed] = useState(false);

  useEffect(() => {
    fetch("/content-creator/api/daily/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.ok && setD7({ today: d.today, posted: d.posted, pending: d.pending, staleCanceled: d.staleCanceled, stuckPublishing: d.stuckPublishing }))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/content-creator/api/posts", { cache: "no-store" });
      if (!res.ok) throw new Error(`โหลดไม่สำเร็จ (${res.status})`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = useCallback(
    async (id: string, action: "approve" | "cancel" | "posted") => {
      setBusyId(id);
      setError(null);
      try {
        const res = await fetch("/content-creator/api/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `${action} ไม่สำเร็จ (${res.status})`);
        await load(); // refresh หลัง transition
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  // copy caption ไปโพสต์ FB เอง [PR#100]
  const copyCaption = useCallback(async (id: string, caption: string | null) => {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      setError("copy ไม่สำเร็จ (เบราว์เซอร์ไม่อนุญาต clipboard)");
    }
  }, []);

  // NOTE [PR#100]: auto-publish (publishPost → /api/publish) ถูกตัดออกจาก UX
  // เพราะ Graph public auto-post ตัน (no-company). route/service ยังอยู่ใน code แต่ไม่ expose ที่นี่
  // กัน​ฟีมเผลอกดยิง FB. legacy APPROVED row แสดงเป็น info เฉยๆ (ไม่มีปุ่มยิง FB)

  const pending = posts.filter((p) => p.status === "GENERATED");
  const approved = posts.filter((p) => p.status === "APPROVED");
  const others = posts.filter((p) => p.status !== "GENERATED" && p.status !== "APPROVED");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Creator</h1>
          <p className="text-sm text-gray-500">รอโพสต์เอง {pending.length} โพสต์</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/content-creator/new"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + สร้างใหม่
          </Link>
          <Link
            href="/content-creator/settings"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            ⚙ Settings
          </Link>
          <button
            onClick={load}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            รีเฟรช
          </button>
        </div>
      </header>

      {/* daily-7 scheduler modal/banner — ปิดทิ้งได้ [S4b] */}
      {d7 && !d7Dismissed && (d7.staleCanceled > 0 || d7.stuckPublishing > 0 || (!d7.posted && d7.pending === 0)) && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div>
            {d7.stuckPublishing > 0 && <div>🛑 มี daily-7 {d7.stuckPublishing} โพสต์ค้าง PUBLISHING (อาจขึ้นเพจแล้ว) — เช็คเพจ + reconcile มือ ห้าม publish ซ้ำ</div>}
            {d7.staleCanceled > 0 && <div>⚠️ มี daily-7 {d7.staleCanceled} โพสต์ถูกยกเลิก (เลยวันแล้ว — scheduler ไม่โพสต์ของผิดวัน)</div>}
            {!d7.posted && d7.pending === 0 && <div>📭 วันนี้ ({d7.today}) ยังไม่มี daily-7 — กด &quot;+ สร้างใหม่&quot; เพื่อ gen แล้วโพสต์เอง</div>}
          </div>
          <button onClick={() => setD7Dismissed(true)} className="shrink-0 rounded px-2 text-amber-600 hover:bg-amber-100">✕</button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {loading && <p className="text-gray-500">กำลังโหลด…</p>}

      {!loading && pending.length === 0 && (
        <p className="rounded-lg bg-gray-50 px-4 py-8 text-center text-gray-500">
          ไม่มีโพสต์รอโพสต์
        </p>
      )}

      <section className="space-y-4">
        {pending.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-xl border shadow-sm">
            {p.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- admin tool, local fs media
              <img src={p.imageUrl} alt="generated" className="aspect-square w-full bg-gray-100 object-cover" />
            )}
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? ""}`}>
                  {p.status}
                </span>
                <span className="text-xs text-gray-400">{p.templateId}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{p.caption}</p>
              {/* manual workflow [PR#100]: copy caption + โหลดรูป → โพสต์ FB เอง → กด "โพสต์แล้ว"/"ลบ" */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => copyCaption(p.id, p.caption)}
                  disabled={!p.caption}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {copiedId === p.id ? "✓ คัดลอกแล้ว" : "📋 คัดลอก caption"}
                </button>
                <a
                  href={p.imageUrl ?? undefined}
                  download={`daily7-${p.id}.png`}
                  aria-disabled={!p.imageUrl}
                  className={`rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 ${p.imageUrl ? "" : "pointer-events-none opacity-50"}`}
                >
                  ⬇️ โหลดรูป
                </a>
                <button
                  onClick={() => act(p.id, "posted")}
                  disabled={busyId === p.id}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {busyId === p.id ? "…" : "✓ โพสต์แล้ว"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("ลบโพสต์นี้? (รูป + caption จะถูกยกเลิก กู้ไม่ได้)")) act(p.id, "cancel");
                  }}
                  disabled={busyId === p.id}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  🗑 ลบ
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {approved.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">APPROVED (legacy {approved.length})</h2>
          <p className="mb-2 text-xs text-amber-700">⚠️ row เก่าจาก auto-publish ที่ปิดไปแล้ว — workflow มือไม่ใช้สถานะนี้ (ไม่มีปุ่มยิง FB)</p>
          <div className="space-y-4">
            {approved.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-xl border border-amber-200 shadow-sm">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- admin tool, local fs media
                  <img src={p.imageUrl} alt="approved" className="aspect-square w-full bg-gray-100 object-cover" />
                )}
                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? ""}`}>
                      {p.status}
                    </span>
                    <span className="text-xs text-gray-400">{p.templateId}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{p.caption}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">โพสต์อื่น</h2>
          <ul className="divide-y rounded-xl border text-sm">
            {others.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-2">
                <span className="truncate text-gray-600">{p.caption ?? p.templateId}</span>
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? ""}`}>
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
