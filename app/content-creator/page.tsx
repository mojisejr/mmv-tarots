"use client";

/**
 * /content-creator — approve UI (admin tool ของฟีม) [S3]
 * แสดงโพสต์ที่ gen เสร็จ (GENERATED) → ฟีมกด approve/cancel.
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
  // daily-7 scheduler status (modal/banner แจ้งเตือน) [S4b]
  const [d7, setD7] = useState<{ today: string; posted: boolean; pending: number; staleCanceled: number } | null>(null);
  const [d7Dismissed, setD7Dismissed] = useState(false);

  useEffect(() => {
    fetch("/content-creator/api/daily/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.ok && setD7({ today: d.today, posted: d.posted, pending: d.pending, staleCanceled: d.staleCanceled }))
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
    async (id: string, action: "approve" | "cancel") => {
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

  const publishPost = useCallback(
    async (id: string) => {
      if (!confirm("เผยแพร่ขึ้นเพจ Facebook จริง? (โพสต์จะขึ้นหน้าเพจ)")) return;
      setBusyId(id);
      setError(null);
      try {
        const res = await fetch("/content-creator/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok || !d.ok) {
          throw new Error(d.error ?? `publish ไม่สำเร็จ (${res.status})`);
        }
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "publish ล้ม");
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const pending = posts.filter((p) => p.status === "GENERATED");
  const approved = posts.filter((p) => p.status === "APPROVED");
  const others = posts.filter((p) => p.status !== "GENERATED" && p.status !== "APPROVED");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Creator</h1>
          <p className="text-sm text-gray-500">รอ approve {pending.length} โพสต์</p>
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
      {d7 && !d7Dismissed && (d7.staleCanceled > 0 || (!d7.posted && d7.pending === 0)) && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div>
            {d7.staleCanceled > 0 && <div>⚠️ มี daily-7 {d7.staleCanceled} โพสต์ถูกยกเลิก (เลยวันแล้ว — scheduler ไม่โพสต์ของผิดวัน)</div>}
            {!d7.posted && d7.pending === 0 && <div>📭 วันนี้ ({d7.today}) ยังไม่มี daily-7 ในคิว — สร้าง+approve เพื่อให้ scheduler โพสต์</div>}
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
          ไม่มีโพสต์รอ approve
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
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => act(p.id, "approve")}
                  disabled={busyId === p.id}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busyId === p.id ? "…" : "Approve"}
                </button>
                <button
                  onClick={() => act(p.id, "cancel")}
                  disabled={busyId === p.id}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {approved.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">รอเผยแพร่ (APPROVED {approved.length})</h2>
          <div className="space-y-4">
            {approved.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-xl border shadow-sm">
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
                  <button
                    onClick={() => publishPost(p.id)}
                    disabled={busyId === p.id}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {busyId === p.id ? "กำลังเผยแพร่…" : "🚀 เผยแพร่ขึ้นเพจ (Publish)"}
                  </button>
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
