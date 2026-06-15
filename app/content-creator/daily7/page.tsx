"use client";
/**
 * daily-7 authoring [S6c.2] — สร้าง draft → gen 7 → แก้/regen → เลือก bg → finalize → contentPost
 * recovery lifecycle (ตู๋): pure logic อยู่ lib/daily7-session (test ครบ lost-response/reload/retry).
 *  - mount: draftId มี → restore(GET) ; requestKey ไม่มี draftId (create response หาย) → resume(POST key เดิม)
 *  - reduceDraft: FINALIZED → อ่าน contentPostId + clear session (กัน finalize-response หายแล้วค้าง)
 *  - dirty fence: finalize save-ก่อน ; regen reuse pendingAttemptKey + เตือน edit ค้าง ; reclaim ได้ตอน GENERATING
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { parseSession, freshSession, reduceDraft, mountAction, regenAttemptKey, createButtonMode, type Session, type DraftView } from "@/content-creator/lib/daily7-session";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;
type Day = { day: string; fortune: string };

const SKEY = "daily7-session-v1";
const uuid = () => crypto.randomUUID();
const bangkokToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const daysKey = (d: Day[]) => JSON.stringify(WEEKDAYS.map((w) => d.find((x) => x.day === w)?.fortune ?? ""));

export default function Daily7Authoring() {
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
  const [postId, setPostId] = useState<string | null>(null);

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
      if (!res.ok) { setErr(`${res.status}: ${data.error ?? "error"}${res.status === 409 ? " (ข้อมูลเปลี่ยน — โหลด/เริ่มใหม่)" : ""}`); return null; }
      return data as { draft?: DraftView; contentPostId?: string };
    } catch (e) { setErr(String(e)); return null; }
    finally { setBusy(false); }
  }, []);

  // apply draft → view + persist session + postId (FINALIZED → clear + แสดงผล) ผ่าน reduceDraft (pure)
  const onDraft = useCallback((draft: DraftView | undefined, base: Session) => {
    if (!draft) return;
    const r = reduceDraft(draft, base);
    setRevision(r.revision); setStatus(r.status); setDays(r.days); setSavedKey(daysKey(r.days));
    persist(r.session);
    if (r.postId) setPostId(r.postId);
  }, [persist]);

  // bg pool (surface error)
  useEffect(() => {
    fetch("/content-creator/api/daily/backgrounds").then((r) => r.json())
      .then((d) => { if (!d.ok) { setBgError(d.error ?? "โหลด bg ไม่ได้"); return; } const ids = d.backgrounds.map((b: { id: string }) => b.id); setBgOptions(ids); if (ids[0]) setBackgroundId(ids[0]); })
      .catch((e) => setBgError(String(e)));
  }, []);

  // mount: restore (GET) หรือ resume (POST key เดิม — create response หาย) — recovery
  useEffect(() => {
    const s = parseSession(localStorage.getItem(SKEY));
    if (!s) return;
    setSession(s); setTargetDate(s.targetDate);
    const act = mountAction(s);
    (async () => {
      if (act.kind === "restore") {
        const res = await fetch(`/content-creator/api/daily/draft/${act.draftId}`);
        if (res.ok) onDraft((await res.json()).draft, s);
      } else if (act.kind === "resume") {
        onDraft((await send("/content-creator/api/daily/draft", { requestKey: act.requestKey, targetDate: act.targetDate }))?.draft, s);
      }
    })();
  }, [onDraft, send]);

  const dirty = useMemo(() => status === "READY" && daysKey(days) !== savedKey, [status, days, savedKey]);
  const previewSrc = useMemo(() => {
    const payload = { targetDate, backgroundId: backgroundId || undefined, days: WEEKDAYS.map((d) => ({ day: d, fortune: days.find((x) => x.day === d)?.fortune?.trim() || "—" })) };
    return `/content-creator/api/daily7-preview?d=${encodeURIComponent(b64(JSON.stringify(payload)))}`;
  }, [targetDate, backgroundId, days]);

  const startNew = async () => {
    if (session?.draftId && !window.confirm("เริ่มใหม่ = ทิ้ง draft เดิม ดำเนินต่อ?")) return;
    setPostId(null);
    const s = freshSession(targetDate, uuid);
    persist(s);
    onDraft((await send("/content-creator/api/daily/draft", { requestKey: s.requestKey, targetDate }))?.draft, s);
  };

  // create response หาย (same-mount, ยังไม่ reload) → retry ด้วย requestKey เดิม [ตู๋ P1] (ไม่ overwrite key)
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
    const d = await send(`/content-creator/api/daily/draft/${session.draftId}/finalize`, { finalizeKey: session.finalizeKey, expectedRevision: rev, backgroundId });
    if (d?.contentPostId) { setPostId(d.contentPostId); setStatus("FINALIZED"); persist(null); }
  };

  const canEdit = status === "READY";
  const canRegen = status === "READY" || status === "FAILED" || status === "GENERATING"; // GENERATING = เผื่อ reclaim stuck
  const showEditor = !!session?.draftId && status !== "FINALIZED";

  return (
    <div style={{ display: "flex", gap: 24, padding: 24, fontFamily: "sans-serif", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 480 }}>
        <h2 style={{ margin: 0 }}>daily-7 — สร้างดวงรายวัน 🔮</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13 }}>วันที่ (กรุงเทพ):</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} disabled={!!session?.draftId} style={{ padding: 6, borderRadius: 8, border: "1px solid #ccc" }} />
          <button onClick={primary} disabled={busy} style={{ padding: "6px 14px", borderRadius: 8, background: "#7B4FC9", color: "#fff", border: 0, cursor: "pointer" }}>
            {{ new: "สร้าง + gen 7 คำทำนาย", resume: "ส่งคำขอสร้างอีกครั้ง", restart: "เริ่มใหม่" }[createButtonMode(session)]}
          </button>
          {status && <span style={{ fontSize: 12, color: "#888" }}>[{status} · rev {revision}{dirty ? " · ●แก้ค้าง" : ""}]</span>}
        </div>

        {bgError && <div style={{ color: "#c0392b", fontSize: 13 }}>⚠️ bg: {bgError}</div>}
        {err && <div style={{ color: "#c0392b", fontSize: 13, background: "#fdecea", padding: 8, borderRadius: 8 }}>{err}</div>}
        {status === "GENERATING" && <div style={{ fontSize: 13, color: "#888" }}>กำลัง gen… (ค้างนาน → กด “gen ใหม่” เพื่อ reclaim)</div>}
        {status === "FAILED" && <div style={{ fontSize: 13, color: "#c0392b" }}>gen ล้ม — กด “gen ใหม่ทั้งชุด”</div>}

        {showEditor && (
          <>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>{d}</label>
                <textarea
                  value={days.find((x) => x.day === d)?.fortune ?? ""}
                  disabled={!canEdit}
                  onChange={(e) => setDays((prev) => [...prev.filter((x) => x.day !== d), { day: d, fortune: e.target.value }])}
                  rows={2}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc", fontFamily: "inherit", resize: "vertical", background: canEdit ? "#fff" : "#f3f3f3" }}
                />
              </div>
            ))}

            <label style={{ fontSize: 13, fontWeight: 600 }}>พื้นหลัง (bg)</label>
            <select value={backgroundId} onChange={(e) => setBackgroundId(e.target.value)} disabled={!bgOptions.length} style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }}>
              {bgOptions.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button onClick={save} disabled={busy || !canEdit || !dirty} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #7B4FC9", background: "#fff", color: "#7B4FC9", cursor: "pointer" }}>บันทึกที่แก้</button>
              <button onClick={regen} disabled={busy || !canRegen} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #888", background: "#fff", cursor: "pointer" }}>gen ใหม่ทั้งชุด</button>
              <button onClick={finalize} disabled={busy || !canEdit || !backgroundId} style={{ padding: "8px 14px", borderRadius: 8, background: "#2FA875", color: "#fff", border: 0, cursor: "pointer" }}>finalize → สร้างโพสต์</button>
            </div>
          </>
        )}

        {postId && (
          <div style={{ background: "#eafaf1", padding: 12, borderRadius: 8, fontSize: 14 }}>
            ✅ finalize แล้ว — contentPost <code>{postId.slice(0, 8)}</code> (PENDING). ไปต่อที่คิว gen ภาพ/approve
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "sticky", top: 24 }}>
        <img key={previewSrc} src={previewSrc} alt="preview" width={480} height={480} style={{ borderRadius: 16, border: "1px solid #eee" }} />
        <span style={{ fontSize: 12, color: "#999" }}>preview สด (renderImage path จริง) · 1080×1080{dirty ? " · กำลังแสดงที่แก้ (ยังไม่บันทึก)" : ""}</span>
      </div>
    </div>
  );
}
