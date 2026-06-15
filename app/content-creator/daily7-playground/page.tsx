"use client";
/**
 * daily-7 playground [S6b browser-truth] — กรอกคำทำนาย 7 วัน → เห็นภาพอัปเดตสด
 * dev tool: เรียก /api/daily7-preview (renderImage ตรง, ไม่แตะ DB/Gemini). ลองเล่น layout/ข้อความ
 */
import { useMemo, useState } from "react";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;

const DEFAULTS: Record<string, string> = {
  จันทร์: "การงานไหลลื่น เจ้านายเอ็นดู มีโอกาสได้งานใหม่",
  อังคาร: "ระวังปากเสียงกับคนใกล้ตัว ใจเย็นไว้",
  พุธ: "การเงินคล่องตัว มีรายได้เสริมเข้ามา",
  พฤหัสบดี: "ความรักสดใส คนโสดมีเกณฑ์เจอคนถูกใจ",
  ศุกร์: "สุขภาพดี พลังงานเต็มเปี่ยม เหมาะเริ่มสิ่งใหม่",
  เสาร์: "มีโชคลาภเล็กๆ จากผู้ใหญ่ ลองเสี่ยงดู",
  อาทิตย์: "ได้พักผ่อนเต็มที่ ครอบครัวอบอุ่น ใจสงบ",
};

function toBase64(s: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}

export default function Daily7Playground() {
  const [dateLabel, setDateLabel] = useState("วันนี้");
  const [fortunes, setFortunes] = useState<Record<string, string>>({ ...DEFAULTS });
  const [seed, setSeed] = useState("playground");

  const src = useMemo(() => {
    const input = {
      dateLabel: dateLabel.trim() || undefined,
      days: WEEKDAYS.map((day) => ({ day, fortune: fortunes[day]?.trim() || "—" })),
    };
    const d = encodeURIComponent(toBase64(JSON.stringify(input)));
    return `/content-creator/api/daily7-preview?d=${d}&seed=${encodeURIComponent(seed)}`;
  }, [dateLabel, fortunes, seed]);

  return (
    <div style={{ display: "flex", gap: 24, padding: 24, fontFamily: "sans-serif", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 460 }}>
        <h2 style={{ margin: 0 }}>daily-7 playground 🔮</h2>
        <p style={{ margin: 0, color: "#666", fontSize: 13 }}>กรอกแล้วภาพอัปเดตสด · ไม่แตะ DB/Gemini · dev only</p>

        <label style={{ fontSize: 13, color: "#444" }}>ป้ายวันที่ (header)</label>
        <input value={dateLabel} onChange={(e) => setDateLabel(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }} />

        {WEEKDAYS.map((day) => (
          <div key={day} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>{day}</label>
            <textarea
              value={fortunes[day] ?? ""}
              onChange={(e) => setFortunes((f) => ({ ...f, [day]: e.target.value }))}
              rows={2}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
        ))}

        <label style={{ fontSize: 13, color: "#444" }}>seed (เปลี่ยน bg เมื่อมี pool หลายใบ — ตอนนี้ N=1 ภาพเดิม)</label>
        <input value={seed} onChange={(e) => setSeed(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "sticky", top: 24 }}>
        {/* key=src → reload ภาพเมื่อ input เปลี่ยน */}
        <img key={src} src={src} alt="daily-7 preview" width={520} height={520} style={{ borderRadius: 16, border: "1px solid #eee", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
        <span style={{ fontSize: 12, color: "#999" }}>1080×1080 · render จริงจาก renderImage (path เดียวกับ production)</span>
      </div>
    </div>
  );
}
