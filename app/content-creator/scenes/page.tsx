"use client";
/**
 * /content-creator/scenes — Scene Library Gallery [PR#105 ก้อน3]
 * gen batch → PENDING grid (✓approve/✗reject) → APPROVED (retire เก่าได้). human gate กันแมวหาย/crop.
 * route guard middleware (404 ถ้า feature ไม่เปิด/production)
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Scene = { id: string; theme: string; status: string; genBatch: string };

export default function ScenesPage() {
  const [pending, setPending] = useState<Scene[]>([]);
  const [approved, setApproved] = useState<Scene[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const [p, a] = await Promise.all([
        fetch("/content-creator/api/scenes?status=PENDING", { cache: "no-store" }).then((r) => r.json()),
        fetch("/content-creator/api/scenes?status=APPROVED", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (p.ok) setPending(p.scenes);
      if (a.ok) { setApproved(a.scenes); setApprovedCount(a.approvedCount); }
    } catch (e) { setErr(String(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = useCallback(async (id: string, action: "approve" | "reject" | "retire") => {
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/content-creator/api/scenes/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? `${action} ไม่สำเร็จ (${res.status})`);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }, [load]);

  const genBatch = useCallback(async () => {
    if (!window.confirm("gen scene ชุดใหม่ 8 ภาพ? (ใช้ Gemini ~2-3 นาที)")) return;
    setGenBusy(true); setErr("");
    try {
      const res = await fetch("/content-creator/api/scenes/gen-batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count: 8 }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? `gen batch ล้ม (${res.status})`);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setGenBusy(false); }
  }, [load]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scene Library 🎴</h1>
          <p className="text-sm text-gray-500">approve ฉากที่มีแมว ไม่ crop → random-cards สุ่มใช้ (APPROVED {approvedCount})</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/content-creator" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">← กลับ</Link>
          <button onClick={genBatch} disabled={genBusy} className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
            {genBusy ? "กำลัง gen… (~2-3 นาที)" : "+ gen ชุดใหม่ (8)"}
          </button>
          <button onClick={load} disabled={busy} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">รีเฟรช</button>
        </div>
      </header>

      {err && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {genBusy && <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">⏳ กำลัง gen scene… อย่าปิดหน้านี้ (Gemini ทีละภาพ)</div>}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">รอ approve (PENDING {pending.length})</h2>
        {pending.length === 0 && <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">ไม่มีฉากรอ approve — กด &quot;gen ชุดใหม่&quot;</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pending.map((s) => (
            <article key={s.id} className="overflow-hidden rounded-xl border shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/content-creator/api/scenes/${s.id}/image`} alt={s.theme} className="aspect-square w-full bg-gray-100 object-cover" />
              <div className="space-y-2 p-2">
                <p className="truncate text-xs text-gray-400">{s.theme}</p>
                <div className="flex gap-2">
                  <button onClick={() => act(s.id, "approve")} disabled={busy} className="flex-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">✓</button>
                  <button onClick={() => act(s.id, "reject")} disabled={busy} className="flex-1 rounded-lg border border-red-300 px-2 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">✗</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {approved.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">ใช้งานอยู่ (APPROVED {approved.length})</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {approved.map((s) => (
              <article key={s.id} className="overflow-hidden rounded-xl border border-emerald-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/content-creator/api/scenes/${s.id}/image`} alt={s.theme} className="aspect-square w-full bg-gray-100 object-cover" />
                <button onClick={() => act(s.id, "retire")} disabled={busy} className="w-full px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50">🗄 retire</button>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
