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
  const [refImagePath, setRefImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/content-creator/api/brand", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.brand) {
          setStylePrompt(d.brand.stylePrompt ?? "");
          setCaptionPersona(d.brand.captionPersona ?? "");
          setRefImagePath(d.brand.refImagePath ?? null);
        }
      })
      .catch(() => setMsg("โหลด brand profile ไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/content-creator/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stylePrompt, captionPersona }),
      });
      if (!res.ok) throw new Error(`บันทึกไม่สำเร็จ (${res.status})`);
      setMsg("✓ บันทึกแล้ว — gen ครั้งต่อไปจะใช้ค่านี้");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "บันทึกล้ม");
    } finally {
      setSaving(false);
    }
  }, [stylePrompt, captionPersona]);

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
            <span className="text-sm font-medium text-gray-700">Caption persona (โทนแคปชั่นหมอมี่)</span>
            <textarea
              value={captionPersona}
              onChange={(e) => setCaptionPersona(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
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
