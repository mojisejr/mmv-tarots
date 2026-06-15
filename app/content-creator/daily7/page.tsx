"use client";
/**
 * daily-7 authoring [S6c.2] — สร้าง draft → gen 7 คำทำนาย → แก้/regen → เลือก bg → finalize → contentPost
 * wire เข้า S6c.1 endpoints. client จัดการ revision (optimistic) + idempotency keys:
 *   requestKey (ต่อ draft) · attemptKey (ต่อ regen) · finalizeKey (ต่อ draft, stable retry)
 */
import { useCallback, useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;
type Day = { day: string; fortune: string };

const uuid = () => crypto.randomUUID();
const todayLocalISO = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (client local — ฟีมเลือกได้)
const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));

export default function Daily7Authoring() {
  const [targetDate, setTargetDate] = useState(todayLocalISO);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [days, setDays] = useState<Day[]>([]);
  const [finalizeKey, setFinalizeKey] = useState("");
  const [bgOptions, setBgOptions] = useState<string[]>([]);
  const [backgroundId, setBackgroundId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [postId, setPostId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/content-creator/api/daily/backgrounds")
      .then((r) => r.json())
      .then((d) => {
        const ids: string[] = (d.backgrounds ?? []).map((b: { id: string }) => b.id);
        setBgOptions(ids);
        if (ids[0]) setBackgroundId(ids[0]);
      })
      .catch(() => {});
  }, []);

  // live preview (ใช้ daily7-preview route — ไม่แตะ DB/Gemini) ; สะท้อน days+bg+date ปัจจุบัน
  const previewSrc = useMemo(() => {
    const payload = { targetDate, backgroundId: backgroundId || undefined, days: WEEKDAYS.map((d) => ({ day: d, fortune: days.find((x) => x.day === d)?.fortune?.trim() || "—" })) };
    return `/content-creator/api/daily7-preview?d=${encodeURIComponent(b64(JSON.stringify(payload)))}`;
  }, [targetDate, backgroundId, days]);

  const send = useCallback(async (url: string, body: object, method = "POST"): Promise<Record<string, unknown> | null> => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setErr(`${res.status}: ${data.error ?? "error"}${res.status === 409 ? " (ข้อมูลเปลี่ยน — สร้าง/โหลดใหม่)" : ""}`);
        return null;
      }
      return data;
    } catch (e) {
      setErr(String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const applyDraft = (d: Record<string, unknown> | null) => {
    if (!d?.draft) return;
    const dr = d.draft as { id: string; revision: number; status: string; draftData?: { days?: Day[] } };
    setDraftId(dr.id);
    setRevision(dr.revision);
    setStatus(dr.status);
    setDays(dr.draftData?.days ?? []);
  };

  const create = async () => {
    setPostId(null);
    setFinalizeKey(uuid());
    applyDraft(await send("/content-creator/api/daily/draft", { requestKey: uuid(), targetDate }));
  };

  const save = async () => {
    applyDraft(await send(`/content-creator/api/daily/draft/${draftId}`, { expectedRevision: revision, days }, "PATCH"));
  };

  const regen = async () => {
    applyDraft(await send(`/content-creator/api/daily/draft/${draftId}/regenerate`, { attemptKey: uuid(), expectedRevision: revision }));
  };

  const finalize = async () => {
    const d = await send(`/content-creator/api/daily/draft/${draftId}/finalize`, { finalizeKey, expectedRevision: revision, backgroundId });
    if (d?.contentPostId) {
      setPostId(d.contentPostId as string);
      setStatus("FINALIZED");
    }
  };

  const editing = !!draftId && status !== "FINALIZED";

  return (
    <div style={{ display: "flex", gap: 24, padding: 24, fontFamily: "sans-serif", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 480 }}>
        <h2 style={{ margin: 0 }}>daily-7 — สร้างดวงรายวัน 🔮</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 13 }}>วันที่:</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} disabled={!!draftId} style={{ padding: 6, borderRadius: 8, border: "1px solid #ccc" }} />
          <button onClick={create} disabled={busy} style={{ padding: "6px 14px", borderRadius: 8, background: "#7B4FC9", color: "#fff", border: 0, cursor: "pointer" }}>
            {draftId ? "สร้างใหม่" : "สร้าง + gen 7 คำทำนาย"}
          </button>
          {status && <span style={{ fontSize: 12, color: "#888" }}>[{status} · rev {revision}]</span>}
        </div>

        {err && <div style={{ color: "#c0392b", fontSize: 13, background: "#fdecea", padding: 8, borderRadius: 8 }}>{err}</div>}

        {editing && (
          <>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>{d}</label>
                <textarea
                  value={days.find((x) => x.day === d)?.fortune ?? ""}
                  onChange={(e) => setDays((prev) => { const o = prev.filter((x) => x.day !== d); return [...o, { day: d, fortune: e.target.value }]; })}
                  rows={2}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc", fontFamily: "inherit", resize: "vertical" }}
                />
              </div>
            ))}

            <label style={{ fontSize: 13, fontWeight: 600 }}>พื้นหลัง (bg)</label>
            <select value={backgroundId} onChange={(e) => setBackgroundId(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }}>
              {bgOptions.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button onClick={save} disabled={busy} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #7B4FC9", background: "#fff", color: "#7B4FC9", cursor: "pointer" }}>บันทึกที่แก้</button>
              <button onClick={regen} disabled={busy} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #888", background: "#fff", cursor: "pointer" }}>gen ใหม่ทั้งชุด</button>
              <button onClick={finalize} disabled={busy || !backgroundId} style={{ padding: "8px 14px", borderRadius: 8, background: "#2FA875", color: "#fff", border: 0, cursor: "pointer" }}>finalize → สร้างโพสต์</button>
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
        <span style={{ fontSize: 12, color: "#999" }}>preview สด (renderImage path จริง) · 1080×1080</span>
      </div>
    </div>
  );
}
