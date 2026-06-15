"use client";
/**
 * daily-7 authoring [S6c.2] — สร้าง draft → gen 7 → แก้/regen → เลือก bg → finalize → contentPost
 *
 * idempotency lifecycle (ตู๋ P1.2): persist session (localStorage) → requestKey/finalizeKey/attemptKey
 *   survive reload/retry → ใช้ backend idempotency จริง (retry เดิมไม่จ่าย Gemini ซ้ำ ; "เริ่มใหม่" = key ใหม่)
 * dirty fence (ตู๋ P1.1): finalize = save-ก่อน (ใช้ revision จาก PATCH) ; regen เตือนถ้ามี edit ค้าง
 *   → contentPost = ข้อความที่เห็นบนจอเสมอ (ไม่ใช่ server draft เก่า)
 * actions narrow ตาม status ; Bangkok tz ชัด ; ไม่กลืน bg error (ตู๋ P2)
 */
import { useCallback, useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;
type Day = { day: string; fortune: string };
type Session = { requestKey: string; targetDate: string; finalizeKey: string; draftId?: string; pendingAttemptKey?: string };

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
  const [savedKey, setSavedKey] = useState(""); // snapshot ของ days ที่ persist บน server (เทียบ dirty)
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

  const applyDraft = useCallback((draft: { id: string; revision: number; status: string; draftData?: { days?: Day[] } } | undefined) => {
    if (!draft) return;
    setRevision(draft.revision);
    setStatus(draft.status);
    const dd = draft.draftData?.days ?? [];
    setDays(dd);
    setSavedKey(daysKey(dd)); // server snapshot = ไม่ dirty ทันทีหลังโหลด/บันทึก
  }, []);

  // โหลด bg pool (surface error — ไม่กลืน) [ตู๋ P2]
  useEffect(() => {
    fetch("/content-creator/api/daily/backgrounds")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setBgError(d.error ?? "โหลด bg ไม่ได้"); return; }
        const ids: string[] = d.backgrounds.map((b: { id: string }) => b.id);
        setBgOptions(ids);
        if (ids[0]) setBackgroundId(ids[0]);
      })
      .catch((e) => setBgError(String(e)));
  }, []);

  // restore session หลัง reload — GET draft กลับมา (state ไม่หาย, key ไม่ generate ใหม่)
  useEffect(() => {
    const raw = localStorage.getItem(SKEY);
    if (!raw) return;
    const s = JSON.parse(raw) as Session;
    setSession(s);
    setTargetDate(s.targetDate);
    if (s.draftId) {
      fetch(`/content-creator/api/daily/draft/${s.draftId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.draft && applyDraft(d.draft))
        .catch(() => {});
    }
  }, [applyDraft]);

  const dirty = useMemo(() => status === "READY" && daysKey(days) !== savedKey, [status, days, savedKey]);

  const previewSrc = useMemo(() => {
    const payload = { targetDate, backgroundId: backgroundId || undefined, days: WEEKDAYS.map((d) => ({ day: d, fortune: days.find((x) => x.day === d)?.fortune?.trim() || "—" })) };
    return `/content-creator/api/daily7-preview?d=${encodeURIComponent(b64(JSON.stringify(payload)))}`;
  }, [targetDate, backgroundId, days]);

  const send = useCallback(async (url: string, body: object, method = "POST") => {
    setBusy(true); setErr("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(`${res.status}: ${data.error ?? "error"}${res.status === 409 ? " (ข้อมูลเปลี่ยน — โหลด/เริ่มใหม่)" : ""}`); return null; }
      return data as { draft?: { id: string; revision: number; status: string; draftData?: { days?: Day[] } }; contentPostId?: string };
    } catch (e) { setErr(String(e)); return null; }
    finally { setBusy(false); }
  }, []);

  // สร้างใหม่ = key ชุดใหม่ (intentional) ; ถ้ามี draft อยู่แล้วเตือนก่อนทิ้ง
  const startNew = async () => {
    if (session?.draftId && !window.confirm("เริ่มใหม่ = ทิ้ง draft เดิม ดำเนินต่อ?")) return;
    setPostId(null);
    const s: Session = { requestKey: uuid(), targetDate, finalizeKey: uuid() };
    persist(s);
    const d = await send("/content-creator/api/daily/draft", { requestKey: s.requestKey, targetDate });
    if (d?.draft) { persist({ ...s, draftId: d.draft.id }); applyDraft(d.draft); }
  };

  const save = async () => {
    if (!session?.draftId) return null;
    const d = await send(`/content-creator/api/daily/draft/${session.draftId}`, { expectedRevision: revision, days }, "PATCH");
    if (d?.draft) applyDraft(d.draft);
    return d?.draft ?? null;
  };

  const regen = async () => {
    if (!session?.draftId) return;
    if (dirty && !window.confirm("ยังไม่ได้บันทึก — gen ใหม่จะทิ้งที่แก้?")) return;
    // reuse pendingAttemptKey (retry ที่ response หาย) ; ไม่มี = regen ใหม่จริง → key ใหม่
    const attemptKey = session.pendingAttemptKey ?? uuid();
    persist({ ...session, pendingAttemptKey: attemptKey });
    const d = await send(`/content-creator/api/daily/draft/${session.draftId}/regenerate`, { attemptKey, expectedRevision: revision });
    if (d?.draft) { applyDraft(d.draft); persist({ ...session, pendingAttemptKey: undefined }); }
  };

  const finalize = async () => {
    if (!session?.draftId || !backgroundId) return;
    let rev = revision;
    if (dirty) { const saved = await save(); if (!saved) return; rev = saved.revision; } // save-ก่อน → contentPost = ที่เห็นบนจอ
    const d = await send(`/content-creator/api/daily/draft/${session.draftId}/finalize`, { finalizeKey: session.finalizeKey, expectedRevision: rev, backgroundId });
    if (d?.contentPostId) { setPostId(d.contentPostId); setStatus("FINALIZED"); persist(null); }
  };

  const canEdit = status === "READY";
  const canRegen = status === "READY" || status === "FAILED";
  const generating = status === "GENERATING";

  return (
    <div style={{ display: "flex", gap: 24, padding: 24, fontFamily: "sans-serif", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 480 }}>
        <h2 style={{ margin: 0 }}>daily-7 — สร้างดวงรายวัน 🔮</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13 }}>วันที่ (กรุงเทพ):</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} disabled={!!session?.draftId} style={{ padding: 6, borderRadius: 8, border: "1px solid #ccc" }} />
          <button onClick={startNew} disabled={busy} style={{ padding: "6px 14px", borderRadius: 8, background: "#7B4FC9", color: "#fff", border: 0, cursor: "pointer" }}>
            {session?.draftId ? "เริ่มใหม่" : "สร้าง + gen 7 คำทำนาย"}
          </button>
          {status && <span style={{ fontSize: 12, color: "#888" }}>[{status} · rev {revision}{dirty ? " · ●แก้ค้าง" : ""}]</span>}
        </div>

        {bgError && <div style={{ color: "#c0392b", fontSize: 13 }}>⚠️ bg: {bgError}</div>}
        {err && <div style={{ color: "#c0392b", fontSize: 13, background: "#fdecea", padding: 8, borderRadius: 8 }}>{err}</div>}
        {generating && <div style={{ fontSize: 13, color: "#888" }}>กำลัง gen… (ถ้าค้างนาน กด “gen ใหม่” เพื่อ reclaim)</div>}
        {status === "FAILED" && <div style={{ fontSize: 13, color: "#c0392b" }}>gen ล้ม — กด “gen ใหม่ทั้งชุด”</div>}

        {session?.draftId && status !== "FINALIZED" && (
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
