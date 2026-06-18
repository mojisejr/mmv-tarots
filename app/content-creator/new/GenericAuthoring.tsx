"use client";

/**
 * GenericAuthoring [Phase C] — พิมพ์ "type" อะไรก็ได้ (free-text) → agent reason content → render → คิว approve.
 * simple-sync UX: กดสร้าง 1 ครั้ง → รอ ~10s → เด้งคิว approve. idempotency/replay ผ่าน generic-create reducer.
 * state แยกของตัวเอง (ไม่ปนกับ card/meaning ของ finance ในหน้าเดียวกัน) [too P2.5].
 */
import { useCallback, useEffect, useState } from "react";
import {
  readSession,
  writeSession,
  clearSession,
  resolveGenericSession,
  classifyGenericResponse,
  shouldClearSession,
} from "@/content-creator/lib/generic-create";

export default function GenericAuthoring({ onFinalized }: { onFinalized: () => void }) {
  const [type, setType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [hasPending, setHasPending] = useState(false);

  // มี session ค้าง (lost-response/reload) → แจ้งให้พิมพ์ type เดิมแล้วกดสร้าง = replay (ไม่จ่ายซ้ำ)
  useEffect(() => {
    setHasPending(!!readSession());
  }, []);

  const ready = type.trim().length > 0;

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    setInfo(null);
    // type เดิม → key เดิม (retry idempotent) ; type เปลี่ยน → key ใหม่
    const session = resolveGenericSession(readSession(), type, crypto.randomUUID());
    writeSession(session);
    try {
      const res = await fetch("/content-creator/api/generic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestKey: session.requestKey, type }),
      });
      const d = await res.json().catch(() => ({}));
      const outcome = classifyGenericResponse(res.status, d);
      if (shouldClearSession(outcome)) {
        clearSession();
        setHasPending(false);
      }

      if (outcome === "success") {
        onFinalized(); // เด้งคิว approve — เห็นโพสต์ใหม่ (GENERATED)
        return;
      }
      if (outcome === "failed") {
        setError(`สร้างไม่สำเร็จ: ${d.error ?? "เนื้อหาไม่ผ่านเกณฑ์"} — ลองพิมพ์ type ใหม่`);
      } else if (outcome === "stale") {
        setError("คำขอก่อนหน้าค้างอยู่ (อาจหลุดกลางคัน) — กดสร้างใหม่ได้เลย ระบบจะใช้คำขอใหม่");
      } else if (outcome === "in-progress") {
        setInfo("กำลังประมวลผล — รอสักครู่แล้วกดสร้างอีกครั้งเพื่อเช็คผล (ระบบไม่จ่าย/สร้างซ้ำ)");
      } else {
        setError(d.error ?? `ไม่สำเร็จ (${res.status}) — ลองใหม่ได้ ระบบจะไม่จ่ายซ้ำ`);
      }
      setSubmitting(false);
    } catch {
      // network/parse error — ไม่รู้ว่า server สำเร็จไหม → เก็บ key (ไม่ clear) retry idempotent
      setError("เชื่อมต่อไม่ได้ — ลองใหม่ได้ ระบบจะไม่สร้าง/จ่ายซ้ำ");
      setSubmitting(false);
    }
  }, [type, onFinalized]);

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {info && <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{info}</div>}
      {hasPending && !error && !info && (
        <div className="rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-500">
          มีคำขอค้างอยู่ — พิมพ์ type เดิมแล้วกดสร้างเพื่อเช็คผล (ระบบจะไม่จ่ายซ้ำ)
        </div>
      )}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Type (พิมพ์อะไรก็ได้)</span>
        <textarea
          value={type}
          onChange={(e) => setType(e.target.value)}
          rows={3}
          placeholder='เช่น "yes-no: วันนี้ควรเริ่มโปรเจกต์ใหม่ไหม" หรือ "ดวงความรักวันนี้"'
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onFinalized}
          className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          ยกเลิก
        </button>
        <button
          onClick={submit}
          disabled={!ready || submitting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "กำลังสร้าง… (~10s)" : "สร้าง + Generate"}
        </button>
      </div>
    </div>
  );
}
