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

  const pending = posts.filter((p) => p.status === "GENERATED");
  const others = posts.filter((p) => p.status !== "GENERATED");

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
          <button
            onClick={load}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            รีเฟรช
          </button>
        </div>
      </header>

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
