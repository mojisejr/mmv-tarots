"use client";
/**
 * random-cards authoring (ฝังใน /new) [PR#103] — สุ่ม 3 ใบ + ตีความ → สุ่มใหม่ → finalize → คิวโพสต์มือ (#100)
 * recovery lifecycle: lib/random-cards-session (pure, test ครบ) — ใช้ backend idempotency จริง
 * (persist requestKey/finalizeKey/draftId/pendingAttemptKey ; lost-response/reload ไม่จ่าย Gemini ซ้ำ) [ตู๋ P1]
 */
import { useCallback, useEffect, useState } from "react";
import { parseSession, freshSession, reduceDraft, mountAction, regenAttemptKey, createButtonMode, reduceFinalize, type Session, type DraftView } from "@/content-creator/lib/random-cards-session";

const SKEY = "random-cards-session-v1";
const uuid = () => crypto.randomUUID();
type CardData = { cardIds: string[]; quote: string; body: string };

export default function RandomCardsAuthoring({ onFinalized }: { onFinalized: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState("");
  const [data, setData] = useState<CardData | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const persist = useCallback((s: Session | null) => {
    setSession(s);
    if (s) localStorage.setItem(SKEY, JSON.stringify(s));
    else localStorage.removeItem(SKEY);
  }, []);

  const send = useCallback(async (url: string, body: object): Promise<{ draft?: DraftView } | null> => {
    setBusy(true); setErr("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok || d.ok === false) { setErr(`${res.status}: ${d.error ?? "error"}${res.status === 409 ? " (ข้อมูลเปลี่ยน — เริ่มใหม่)" : ""}`); return null; }
      return d;
    } catch (e) { setErr(String(e)); return null; } finally { setBusy(false); }
  }, []);

  const onDraft = useCallback((draft: DraftView | undefined, base: Session) => {
    if (!draft) return;
    const r = reduceDraft(draft, base);
    setRevision(r.revision); setStatus(r.status); setData(r.data); persist(r.session);
  }, [persist]);

  // card names (UI map)
  useEffect(() => {
    fetch("/content-creator/api/cards/list").then((r) => r.json()).then((d) => {
      if (d.ok) setNames(Object.fromEntries(d.cards.map((c: { id: string; nameTh: string }) => [c.id, c.nameTh])));
    }).catch(() => {});
  }, []);

  // restore/resume หลัง reload (recovery)
  useEffect(() => {
    const s = parseSession(localStorage.getItem(SKEY));
    if (!s) return;
    setSession(s);
    const act = mountAction(s);
    (async () => {
      if (act.kind === "restore") {
        const res = await fetch(`/content-creator/api/cards/draft/${act.draftId}`);
        if (res.ok) onDraft((await res.json()).draft, s);
      } else if (act.kind === "resume") {
        onDraft((await send("/content-creator/api/cards/draft", { requestKey: act.requestKey }))?.draft, s);
      }
    })();
  }, [onDraft, send]);

  const startNew = async () => {
    if (session?.draftId && !window.confirm("เริ่มใหม่ = ทิ้งชุดเดิม ดำเนินต่อ?")) return;
    const s = freshSession(uuid);
    persist(s);
    onDraft((await send("/content-creator/api/cards/draft", { requestKey: s.requestKey }))?.draft, s);
  };
  const resumeCreate = async () => {
    if (!session) return;
    onDraft((await send("/content-creator/api/cards/draft", { requestKey: session.requestKey }))?.draft, session);
  };
  const primary = () => (createButtonMode(session) === "resume" ? resumeCreate() : startNew());

  const regen = async () => {
    if (!session?.draftId) return;
    const attemptKey = regenAttemptKey(session, uuid);
    persist({ ...session, pendingAttemptKey: attemptKey }); // persist ก่อน call → retry replay ไม่จ่ายซ้ำ
    const d = await send(`/content-creator/api/cards/draft/${session.draftId}/regenerate`, { attemptKey, expectedRevision: revision });
    if (d?.draft) onDraft(d.draft, { ...session, pendingAttemptKey: undefined });
  };

  const finalize = async () => {
    if (!session?.draftId) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/content-creator/api/cards/draft/${session.draftId}/finalize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalizeKey: session.finalizeKey, expectedRevision: revision }),
      });
      const o = reduceFinalize(await res.json());
      if (o.kind === "queue") { persist(null); onFinalized(); return; }
      if (o.kind === "processing") { setStatus("FINALIZED"); } // lock — keep session ให้ retry replay
      else { persist(null); setStatus(""); setData(null); setErr(o.message); } // failed → reset
    } catch (e) { setErr(String(e)); } finally { setBusy(false); }
  };

  const ready = status === "READY" && !!data;
  const mode = createButtonMode(session);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={primary} disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
          {{ new: "🎴 สุ่มไพ่ + ตีความ", resume: "ส่งคำขอสุ่มอีกครั้ง", restart: "สุ่มชุดใหม่ (เริ่มต้น)" }[mode]}
        </button>
        {status && <span className="text-xs text-gray-500">[{status} · rev {revision}]</span>}
      </div>

      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      {status === "FAILED" && <div className="text-xs text-red-600">สุ่ม/ตีความล้ม — กด “สุ่มชุดใหม่”</div>}

      {ready && data && (
        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex flex-wrap gap-2">
            {data.cardIds.map((id) => <span key={id} className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-800">🃏 {names[id] ?? id}</span>)}
          </div>
          <div><div className="text-xs font-semibold text-gray-500">คำพูดเด่น</div><p className="text-sm font-medium text-gray-800">{data.quote}</p></div>
          <div><div className="text-xs font-semibold text-gray-500">คำทำนาย</div><p className="whitespace-pre-wrap text-sm text-gray-700">{data.body}</p></div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={regen} disabled={busy} className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">🔄 สุ่มใหม่ทั้งชุด</button>
            <button onClick={finalize} disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {busy ? "กำลังสร้างภาพ…" : "✓ ยืนยัน + สร้างภาพ → ไปคิวโพสต์"}
            </button>
          </div>
        </div>
      )}

      {session?.draftId && status === "FINALIZED" && (
        <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
          <p>ยืนยันแล้ว · กำลังสร้างภาพ — เข้าคิวโพสต์แล้ว (ชุดนี้ถูกล็อก)</p>
          <div className="flex gap-2">
            <button onClick={onFinalized} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">ไปดูคิวโพสต์</button>
            <button onClick={finalize} disabled={busy} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white disabled:opacity-50">เช็คอีกครั้ง</button>
          </div>
        </div>
      )}
    </div>
  );
}
