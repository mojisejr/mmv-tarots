/**
 * classify create response → ตัดสิน clear key / redirect [S3.5a ตู๋ P1]
 *
 * client เคยเดา definitive จาก HTTP-code combo (เปราะ): clear เฉพาะ 200 GENERATED / 502 FAILED
 * → duplicate FAILED ที่ route ตอบ "200 FAILED" หลุด → key ค้าง stuck FAILED ตลอด.
 * แก้: server บอก `definitive` ตรง ๆ → client clear ทุก definitive (terminal จริง).
 */
export type CreateOutcome = "success" | "failed" | "in-progress" | "unknown";

export type CreateResponseBody = {
  definitive?: boolean;
  ok?: boolean;
  inProgress?: boolean;
};

export function classifyCreateResponse(httpStatus: number, body: CreateResponseBody): CreateOutcome {
  if (httpStatus === 202 || body.inProgress) return "in-progress"; // ยังไม่ terminal — เก็บ key
  if (body.definitive) return body.ok ? "success" : "failed"; // terminal จริง — clear key
  return "unknown"; // 400/409/500/network/ผลไม่ชัด — เก็บ key (retry idempotent)
}

/** clear pending key เมื่อ outcome เป็น terminal definitive (สำเร็จ/ล้มจริง) เท่านั้น */
export function shouldClearPending(outcome: CreateOutcome): boolean {
  return outcome === "success" || outcome === "failed";
}
