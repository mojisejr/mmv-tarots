"use client";
/**
 * daily-7 authoring (ฝังใน /new เมื่อเลือก template daily-7) [S6c.2]
 * draft → gen 7 → แก้/regen → เลือก bg → finalize(+generate) → onFinalized(เด้งไปคิว approve)
 * recovery lifecycle: lib/daily7-session (pure, test ครบ) ; preview = POST+blob (robust)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseSession, freshSession, reduceDraft, mountAction, restoreAction, regenAttemptKey, createButtonMode, reduceFinalize, type Session, type DraftView } from "@/content-creator/lib/daily7-session";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;
type Day = { day: string; fortune: string };
const SKEY = "daily7-session-v1";
const uuid = () => crypto.randomUUID();
const bangkokToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const daysKey = (d: Day[]) => JSON.stringify(WEEKDAYS.map((w) => d.find((x) => x.day === w)?.fortune ?? ""));

export default function Daily7Authoring({ onFinalized }: { onFinalized: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [targetDate, setTargetDate] = useState(bangkokToday);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState("");
  const [days, setDays] = useState<Day[]>([]);
  const [savedKey, setSavedKey] = useState("");
  const [bgOptions, setBgOptions] = useState<string[]>([]);
  const [backgroundId, setBackgroundId] = useState("");
  const [bgError, setBgError] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const previewUrlRef = useRef("");
  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []); // P2: กัน leak ตอน unmount

  const persist = useCallback((s: Session | null) => {
    setSession(s);
    if (s) localStorage.setItem(SKEY, JSON.stringify(s));
    else localStorage.removeItem(SKEY);
  }, []);

  const send = useCallback(async (url: string, body: object, method = "POST") => {
    setBusy(true); setErr("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setErr(`${res.status}: ${data.error ?? data.draft?.error ?? "error"}${res.status === 409 ? " (ข้อมูลเปลี่ยน — โหลด/เริ่มใหม่)" : ""}`);
        return data.draft ? data : null;
      }
      return data as { draft?: DraftView; contentPostId?: string; status?: string };
    } catch (e) { setErr(String(e)); return null; }
    finally { setBusy(false); }
  }, []);

  const onDraft = useCallback((draft: DraftView | undefined, base: Session) => {
    if (!draft) return;
    const r = reduceDraft(draft, base);
    setRevision(r.revision); setStatus(r.status); setDays(r.days); setSavedKey(daysKey(r.days));
    persist(r.session);
  }, [persist]);

  const replayFinalize = useCallback(async (sess: Session, rev: number, backgroundIdOverride?: string) => {
    if (!sess.draftId) return;
    const selectedBackgroundId = backgroundIdOverride || sess.backgroundId;
    if (!selectedBackgroundId) {
      setErr("ยังไม่มีพื้นหลังสำหรับเช็คผล finalize เดิม — เลือกพื้นหลังแล้วกดเช็คอีกครั้ง");
      return;
    }
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/content-creator/api/daily/draft/${sess.draftId}/finalize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalizeKey: sess.finalizeKey, expectedRevision: rev, backgroundId: selectedBackgroundId }),
      });
      const o = reduceFinalize(await res.json());
      if (o.kind === "queue") { persist(null); onFinalized(); return; }
      if (o.kind === "processing") {
        const next = { ...sess, backgroundId: selectedBackgroundId };
        setSession(next); setRevision(rev); setStatus("FINALIZED"); persist(next);
      } else {
        persist(null); setStatus(""); setDays([]); setSavedKey(""); setErr(o.message);
      }
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }, [persist, onFinalized]);

  // bg pool (surface error)
  useEffect(() => {
    fetch("/content-creator/api/daily/backgrounds").then((r) => r.json())
      .then((d) => { if (!d.ok) { setBgError(d.error ?? "โหลด bg ไม่ได้"); return; } const ids = d.backgrounds.map((b: { id: string }) => b.id); setBgOptions(ids); if (ids[0]) setBackgroundId(ids[0]); })
      .catch((e) => setBgError(String(e)));
  }, []);

  // restore/resume หลัง reload (recovery)
  useEffect(() => {
    const s = parseSession(localStorage.getItem(SKEY));
    if (!s) return;
    setSession(s); setTargetDate(s.targetDate);
    if (s.backgroundId) setBackgroundId(s.backgroundId);
    const act = mountAction(s);
    (async () => {
      if (act.kind === "restore") {
        const res = await fetch(`/content-creator/api/daily/draft/${act.draftId}`);
        if (!res.ok) return;
        const draft = (await res.json()).draft as DraftView;
        const ra = restoreAction(draft);
        if (ra.kind === "replay-finalize") await replayFinalize(s, ra.revision, s.backgroundId);
        else onDraft(draft, s);
      } else if (act.kind === "resume") {
        onDraft((await send("/content-creator/api/daily/draft", { requestKey: act.requestKey, targetDate: act.targetDate }))?.draft, s);
      }
    })();
  }, [onDraft, send, replayFinalize]);

  const dirty = useMemo(() => status === "READY" && daysKey(days) !== savedKey, [status, days, savedKey]);
  const previewBody = useMemo(
    () => JSON.stringify({ targetDate, backgroundId: backgroundId || undefined, days: WEEKDAYS.map((d) => ({ day: d, fortune: days.find((x) => x.day === d)?.fortune?.trim() || "—" })) }),
    [targetDate, backgroundId, days],
  );

  // preview = POST + blob → objectURL (robust ; debounce กันยิงรัวตอนพิมพ์)
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/content-creator/api/daily7-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: previewBody });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        const obj = URL.createObjectURL(blob);
        setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return obj; });
        previewUrlRef.current = obj;
      } catch { /* preview เป็น best-effort */ }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [previewBody]);

  const startNew = async () => {
    if (session?.draftId && !window.confirm("เริ่มใหม่ = ทิ้ง draft เดิม ดำเนินต่อ?")) return;
    const s = freshSession(targetDate, uuid);
    persist(s);
    onDraft((await send("/content-creator/api/daily/draft", { requestKey: s.requestKey, targetDate }))?.draft, s);
  };
  const resumeCreate = async () => {
    if (!session) return;
    onDraft((await send("/content-creator/api/daily/draft", { requestKey: session.requestKey, targetDate: session.targetDate }))?.draft, session);
  };
  const primary = () => (createButtonMode(session) === "resume" ? resumeCreate() : startNew());

  const save = async (): Promise<DraftView | null> => {
    if (!session?.draftId) return null;
    const d = await send(`/content-creator/api/daily/draft/${session.draftId}`, { expectedRevision: revision, days }, "PATCH");
    if (d?.draft) onDraft(d.draft, session);
    return d?.draft ?? null;
  };
  const regen = async () => {
    if (!session?.draftId) return;
    if (dirty && !window.confirm("ยังไม่ได้บันทึก — gen ใหม่จะทิ้งที่แก้?")) return;
    const attemptKey = regenAttemptKey(session, uuid);
    persist({ ...session, pendingAttemptKey: attemptKey });
    const d = await send(`/content-creator/api/daily/draft/${session.draftId}/regenerate`, { attemptKey, expectedRevision: revision });
    if (d?.draft) onDraft(d.draft, { ...session, pendingAttemptKey: undefined });
  };
  const finalize = async () => {
    if (!session?.draftId || !backgroundId) return;
    let rev = revision;
    if (dirty) { const saved = await save(); if (!saved) return; rev = saved.revision; }
    const finalizedSession = { ...session, backgroundId };
    persist(finalizedSession);
    await replayFinalize(finalizedSession, rev, backgroundId);
  };

  const canEdit = status === "READY";
  const canRegen = status === "READY" || status === "FAILED" || status === "GENERATING";
  const showEditor = !!session?.draftId && status !== "FINALIZED";
  const mode = createButtonMode(session);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} disabled={!!session?.draftId} className="rounded-lg border px-3 py-2 text-sm" />
          <button onClick={primary} disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
            {{ new: "สร้าง + gen 7 คำทำนาย", resume: "ส่งคำขอสร้างอีกครั้ง", restart: "เริ่มใหม่" }[mode]}
          </button>
          {status && <span className="text-xs text-gray-500">[{status} · rev {revision}{dirty ? " · ●แก้ค้าง" : ""}]</span>}
        </div>

        {bgError && <div className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">⚠️ bg: {bgError}</div>}
        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        {status === "GENERATING" && <div className="text-xs text-gray-500">กำลัง gen… (ค้างนาน → กด “gen ใหม่” เพื่อ reclaim)</div>}
        {status === "FAILED" && <div className="text-xs text-red-600">gen ล้ม — กด “gen ใหม่ทั้งชุด” (หรือ finalize อาจติด: ยังไม่ตั้ง CTA ใน Settings)</div>}

        {showEditor && (
          <div className="space-y-2">
            {WEEKDAYS.map((d) => (
              <label key={d} className="block">
                <span className="text-xs font-semibold text-gray-600">{d}</span>
                <textarea
                  value={days.find((x) => x.day === d)?.fortune ?? ""}
                  disabled={!canEdit}
                  onChange={(e) => setDays((prev) => [...prev.filter((x) => x.day !== d), { day: d, fortune: e.target.value }])}
                  rows={2}
                  className="mt-0.5 w-full rounded-lg border px-3 py-1.5 text-sm disabled:bg-gray-100"
                />
              </label>
            ))}

            <label className="block">
              <span className="text-xs font-semibold text-gray-600">พื้นหลัง</span>
              <select value={backgroundId} onChange={(e) => setBackgroundId(e.target.value)} disabled={!bgOptions.length} className="mt-0.5 w-full rounded-lg border px-3 py-2 text-sm">
                {bgOptions.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={save} disabled={busy || !canEdit || !dirty} className="rounded-lg border border-violet-600 px-3 py-2 text-sm text-violet-700 hover:bg-violet-50 disabled:opacity-40">บันทึกที่แก้</button>
              <button onClick={regen} disabled={busy || !canRegen} className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">gen ใหม่ทั้งชุด</button>
              <button onClick={finalize} disabled={busy || !canEdit || !backgroundId} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {busy ? "กำลังทำ…" : "finalize + สร้างโพสต์ → คิว approve"}
              </button>
            </div>
          </div>
        )}

        {session?.draftId && status === "FINALIZED" && (
          <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
            <p>finalize แล้ว · กำลัง gen ภาพ — โพสต์เข้าคิว approve แล้ว (draft ถูกล็อก แก้ไม่ได้)</p>
            <div className="flex gap-2">
              <button onClick={onFinalized} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">ไปดูคิว approve</button>
              <button onClick={finalize} disabled={busy} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white disabled:opacity-50">เช็คอีกครั้ง</button>
            </div>
          </div>
        )}
      </div>

      <div className="md:sticky md:top-6 md:self-start">
        <div className="overflow-hidden rounded-2xl border bg-gray-50">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="daily-7 preview" className="block w-full" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-sm text-gray-400">{showEditor ? "กำลังเรนเดอร์พรีวิว…" : "กด “สร้าง” เพื่อเริ่ม"}</div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-400">พรีวิวสด (renderImage path จริง){dirty ? " · กำลังแสดงที่แก้ (ยังไม่บันทึก)" : ""}</p>
      </div>
    </div>
  );
}
