"use client";
/**
 * random-cards authoring (ฝังใน /new เมื่อเลือก template random-cards) [PR#103]
 * create (สุ่ม 3 ใบ + ตีความ) → ดูไพ่/คำทำนาย → สุ่มใหม่ (regen) → finalize(+generate) → ไปคิวโพสต์มือ (#100)
 * lean: ไม่ edit ไพ่มือ (สุ่มใหม่อย่างเดียว) ; restore draftId หลัง reload (localStorage)
 */
import { useCallback, useEffect, useState } from "react";

const SKEY = "random-cards-session-v1";
const uuid = () => crypto.randomUUID();

type DraftData = { cardIds: string[]; quote: string; body: string };
type Draft = { id: string; status: string; revision: number; draftData?: DraftData; error?: string | null };

export default function RandomCardsAuthoring({ onFinalized }: { onFinalized: () => void }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/content-creator/api/cards/list").then((r) => r.json()).then((d) => {
      if (d.ok) setNames(Object.fromEntries(d.cards.map((c: { id: string; nameTh: string }) => [c.id, c.nameTh])));
    }).catch(() => {});
    const id = localStorage.getItem(SKEY);
    if (id) fetch(`/content-creator/api/cards/draft/${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.ok) setDraft(d.draft); }).catch(() => {});
  }, []);

  const send = useCallback(async (url: string, body: object): Promise<Draft | null> => {
    setBusy(true); setErr("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok || d.ok === false) { setErr(`${res.status}: ${d.error ?? "error"}`); return null; }
      return d.draft as Draft;
    } catch (e) { setErr(String(e)); return null; } finally { setBusy(false); }
  }, []);

  const create = useCallback(async () => {
    if (draft && !window.confirm("เริ่มใหม่ = ทิ้งชุดเดิม ดำเนินต่อ?")) return;
    const d = await send("/content-creator/api/cards/draft", { requestKey: uuid() });
    if (d) { setDraft(d); localStorage.setItem(SKEY, d.id); }
  }, [draft, send]);

  const regen = useCallback(async () => {
    if (!draft) return;
    const d = await send(`/content-creator/api/cards/draft/${draft.id}/regenerate`, { attemptKey: uuid(), expectedRevision: draft.revision });
    if (d) setDraft(d);
  }, [draft, send]);

  const finalize = useCallback(async () => {
    if (!draft) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/content-creator/api/cards/draft/${draft.id}/finalize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalizeKey: `fk-${draft.id}`, expectedRevision: draft.revision }),
      });
      const d = await res.json();
      if (d.ok) { localStorage.removeItem(SKEY); onFinalized(); return; } // GENERATED → ไปคิวโพสต์มือ
      setErr(`${res.status}: ${d.error ?? (d.status === "FAILED" ? "gen ล้ม (เช็ค CTA ใน Settings)" : "ยังไม่เสร็จ")}`);
    } catch (e) { setErr(String(e)); } finally { setBusy(false); }
  }, [draft, onFinalized]);

  const data = draft?.draftData;
  const ready = draft?.status === "READY" && !!data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={create} disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
          {busy && !draft ? "กำลังสุ่ม…" : draft ? "สุ่มชุดใหม่ (เริ่มต้น)" : "🎴 สุ่มไพ่ + ตีความ"}
        </button>
        {draft && <span className="text-xs text-gray-500">[{draft.status} · rev {draft.revision}]</span>}
      </div>

      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      {draft?.status === "FAILED" && <div className="text-xs text-red-600">สุ่ม/ตีความล้ม — กด “สุ่มอีกครั้ง”</div>}

      {ready && data && (
        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex flex-wrap gap-2">
            {data.cardIds.map((id) => (
              <span key={id} className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-800">🃏 {names[id] ?? id}</span>
            ))}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500">คำพูดเด่น</div>
            <p className="text-sm font-medium text-gray-800">{data.quote}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500">คำทำนาย</div>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{data.body}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={regen} disabled={busy} className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">🔄 สุ่มใหม่ทั้งชุด</button>
            <button onClick={finalize} disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {busy ? "กำลังสร้างภาพ…" : "✓ ยืนยัน + สร้างภาพ → ไปคิวโพสต์"}
            </button>
          </div>
          <p className="text-xs text-gray-400">ยืนยันแล้วระบบ gen ภาพ (แมว Mimi + ไพ่ + คำทำนาย) → ไปโพสต์เองในหน้าหลัก</p>
        </div>
      )}
    </div>
  );
}
