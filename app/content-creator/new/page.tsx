"use client";

/**
 * /content-creator/new — สร้าง content ใหม่ + gen (sync) [S3.5a]
 * เลือก template → กรอก input → (พรีวิว prompt) → สร้าง+Generate → เด้งกลับคิว approve
 *
 * NOTE: ตอนนี้มี template เดียว (finance-daily) → form fields hardcode card+meaning.
 *       เมื่อมี template หลายแบบ ค่อยทำ field-render แบบ data-driven จาก schema
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PreviewGuard } from "@/content-creator/lib/preview-guard";
import { readPending, writePending, clearPending, resolveRequestKey } from "@/content-creator/lib/request-draft";

type TemplateOpt = { id: string; name: string };

export default function NewContentPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateOpt[]>([]);
  const [templateId, setTemplateId] = useState("finance-daily");
  const [card, setCard] = useState("");
  const [meaning, setMeaning] = useState("");
  const [preview, setPreview] = useState<{ caption: string; image: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // guard preview stale/out-of-order [ตู๋ P2] — sequence, invalidate ตอน input เปลี่ยน
  const previewGuard = useRef(new PreviewGuard());

  // โหลด template list + restore pending draft (เผื่อ reload ระหว่าง in-flight → คงค่า+ใช้ key เดิม) [ตู๋ P1]
  useEffect(() => {
    fetch("/content-creator/api/templates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { templates: [] }))
      .then((d) => {
        setTemplates(d.templates ?? []);
        if (d.templates?.[0]) setTemplateId(d.templates[0].id);
      })
      .catch(() => {});
    const pending = readPending();
    if (pending) {
      setTemplateId(pending.payload.templateId);
      setCard(pending.payload.card);
      setMeaning(pending.payload.meaning);
    }
  }, []);

  const inputData = { card, meaning };
  const ready = card.trim() && meaning.trim();

  // input เปลี่ยน → preview เดิม stale: เคลียร์ + invalidate guard (สำคัญ: ไม่งั้น A กลับมาก่อนกด preview ใหม่จะผ่าน) [ตู๋ P2]
  useEffect(() => {
    setPreview(null);
    previewGuard.current.invalidate();
  }, [templateId, card, meaning]);

  const doPreview = useCallback(async () => {
    setError(null);
    const token = previewGuard.current.begin();
    try {
      const res = await fetch("/content-creator/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, inputData }),
      });
      const d = await res.json();
      if (!previewGuard.current.accepts(token)) return; // มีอะไรใหม่กว่า (input เปลี่ยน/preview ใหม่) → ทิ้ง
      if (!res.ok) throw new Error(d.error ?? "preview ไม่สำเร็จ");
      setPreview({ caption: `${d.captionPrompt.system}\n---\n${d.captionPrompt.prompt}`, image: d.imagePrompt });
    } catch (e) {
      if (!previewGuard.current.accepts(token)) return;
      setError(e instanceof Error ? e.message : "preview ล้ม");
    }
  }, [templateId, card, meaning]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    // idempotency key ที่ persist ข้าม reload: payload เดิม→key เดิม (retry idempotent), เปลี่ยน→key ใหม่ [ตู๋ P1]
    const payload = { templateId, card, meaning };
    const pending = resolveRequestKey(readPending(), payload, crypto.randomUUID());
    writePending(pending);
    try {
      const res = await fetch("/content-creator/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestKey: pending.requestKey, templateId, inputData }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) throw new Error(d.error ?? `สร้างไม่สำเร็จ (${res.status})`);
      clearPending(); // สำเร็จแล้ว → submit ครั้งหน้า = attempt ใหม่
      router.push("/content-creator"); // เด้งกลับคิว approve — เห็นโพสต์ใหม่ (GENERATED)
    } catch (e) {
      // ไม่ clear pending → reload/retry ใช้ key เดิม ไม่จ่าย Gemini ซ้ำ
      setError(e instanceof Error ? e.message : "สร้างล้ม");
      setSubmitting(false);
    }
  }, [templateId, card, meaning, router]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <button onClick={() => router.push("/content-creator")} className="text-sm text-gray-500 hover:underline">
          ← กลับ
        </button>
        <h1 className="text-2xl font-bold">สร้าง content ใหม่</h1>
      </header>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Template</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {templates.length === 0 && <option value="finance-daily">finance-daily</option>}
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">ไพ่ (card)</span>
          <input
            value={card}
            onChange={(e) => setCard(e.target.value)}
            placeholder="เช่น The Sun"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">ความหมายการเงินวันนี้ (meaning)</span>
          <textarea
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            rows={3}
            placeholder="เช่น การเงินสดใส มีโอกาสรายได้ก้อนใหม่เข้ามา"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>

        <div>
          <button onClick={doPreview} disabled={!ready} className="text-sm text-blue-600 hover:underline disabled:text-gray-300">
            ▸ พรีวิว prompt ที่จะส่ง Gemini
          </button>
          {preview && (
            <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-3 text-xs">
              <div>
                <div className="font-semibold text-gray-500">caption prompt</div>
                <pre className="whitespace-pre-wrap text-gray-700">{preview.caption}</pre>
              </div>
              <div>
                <div className="font-semibold text-gray-500">image prompt</div>
                <pre className="whitespace-pre-wrap text-gray-700">{preview.image}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => router.push("/content-creator")}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={!ready || submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "กำลัง gen… (~10s)" : "สร้าง + Generate"}
          </button>
        </div>
      </div>
    </main>
  );
}
