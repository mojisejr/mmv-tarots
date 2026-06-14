"use client";

/**
 * /content-creator/settings — Brand Profile หมอมี่ [S3.5b/c]
 * ฟีมแก้ style prompt + caption tone เอง → ทุก gen ใช้ค่านี้ (theme เดียวกัน)
 * ตัวละคร (ref image) = หมอมี่ fixed ใน PR นี้ ; upload ref เอง = follow-up
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BrandSettingsPage() {
  const router = useRouter();
  const [stylePrompt, setStylePrompt] = useState("");
  const [captionPersona, setCaptionPersona] = useState("");
  const [captionMaxChars, setCaptionMaxChars] = useState(300);
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [refImagePath, setRefImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false); // โหลด profile สำเร็จไหม — กัน save ทับด้วยค่าว่าง [ตู๋ P2]
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/content-creator/api/brand", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`โหลดไม่สำเร็จ (${r.status})`);
        const d = await r.json();
        if (d?.brand) {
          setStylePrompt(d.brand.stylePrompt ?? "");
          setCaptionPersona(d.brand.captionPersona ?? "");
          setCaptionMaxChars(d.brand.captionMaxChars ?? 300);
          setCtaText(d.brand.ctaText ?? "");
          setCtaUrl(d.brand.ctaUrl ?? "");
          setRefImagePath(d.brand.refImagePath ?? null);
          setLoaded(true); // โหลดสำเร็จ → save ได้ (ไม่งั้น save จะ wipe config ด้วยค่าว่าง)
        }
      })
      .catch(() => setMsg("⚠️ โหลด brand profile ไม่สำเร็จ — รีเฟรชก่อนแก้ (กันบันทึกทับค่าเดิมด้วยฟอร์มว่าง)"))
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/content-creator/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stylePrompt, captionPersona, captionMaxChars, ctaText, ctaUrl }),
      });
      if (!res.ok) throw new Error(`บันทึกไม่สำเร็จ (${res.status})`);
      setMsg("✓ บันทึกแล้ว — gen ครั้งต่อไปจะใช้ค่านี้");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "บันทึกล้ม");
    } finally {
      setSaving(false);
    }
  }, [stylePrompt, captionPersona, captionMaxChars, ctaText, ctaUrl]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <button onClick={() => router.push("/content-creator")} className="text-sm text-gray-500 hover:underline">
          ← กลับ
        </button>
        <h1 className="text-2xl font-bold">Brand Profile — หมอมี่</h1>
      </header>

      {msg && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{msg}</div>}
      {loading ? (
        <p className="text-gray-500">กำลังโหลด…</p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ตัวละคร = <b>หมอมี่ (แมว)</b> ใช้ภาพ reference fixed:{" "}
            <code className="text-xs">{refImagePath ?? "(ไม่ได้ตั้ง)"}</code> — ทุก gen จะยึดตัวละคร+สไตล์นี้
            <br />
            <span className="text-xs text-amber-600">(เปลี่ยน/อัปโหลด ref เอง = ฟีเจอร์รอบถัดไป)</span>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Style prompt (โทน/สไตล์ภาพ — ต่อท้ายทุก gen)</span>
            <textarea
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Caption persona (โทนแคปชั่นหมอมี่ — ฟันธงสั้น)</span>
            <textarea
              value={captionPersona}
              onChange={(e) => setCaptionPersona(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">ความยาว caption สูงสุด (ตัวอักษร)</span>
            <input
              type="number"
              value={captionMaxChars}
              onChange={(e) => setCaptionMaxChars(Number(e.target.value) || 300)}
              min={50}
              max={2000}
              className="mt-1 w-32 rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
            <p className="mb-2 text-sm font-semibold text-blue-800">CTA ชวนเข้าใช้ระบบ (บังคับแนบทุกโพสต์)</p>
            <label className="block">
              <span className="text-xs text-gray-600">ข้อความชวน (model เรียบเรียงใหม่ทุกครั้ง ไม่ซ้ำ)</span>
              <textarea
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                rows={2}
                placeholder="เช่น อยากรู้ดวงการเงินเจาะลึก ทักหาพี่หมี่ได้เลย"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-2 block">
              <span className="text-xs text-gray-600">ลิงก์ระบบ (แนบท้ายเป๊ะทุกโพสต์ — ว่าง = ไม่บังคับลิงก์)</span>
              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving || !loaded}
              title={!loaded ? "โหลด profile ไม่สำเร็จ — รีเฟรชก่อน" : undefined}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
