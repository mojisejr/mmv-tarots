/**
 * content-creator/lib/facebook.ts — post ขึ้น FB page ผ่าน Graph API (Gate B)
 *
 * Gate B (จาก ตู๋ review PR#85):
 *  - [SEC] token ไป header Authorization: Bearer (ไม่ใส่ URL query — กัน log/history leak)
 *  - Graph version จาก config (ไม่ hardcode)
 *  - res.ok check ก่อน .json() + timeout + retry 429/5xx
 *  - publish-on-approve: upload unpublished (เก็บ media_fbid) → publishToFeed ตอน approve
 */
import { graphUrl } from "./config";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface FbFetchOptions {
  token: string;
  method?: "GET" | "POST" | "DELETE";
  body?: BodyInit;
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Graph API fetch wrapper — token ใน header, ตรวจ res.ok, timeout, retry.
 * @throws Error ถ้า non-2xx (non-retryable หรือ retry หมด) หรือ network/timeout
 */
export async function fbFetch<T = unknown>(path: string, opts: FbFetchOptions): Promise<T> {
  const { token, method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_MAX_RETRIES } = opts;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(graphUrl(path), {
        method,
        headers: { Authorization: `Bearer ${token}` }, // [SEC] token ใน header ไม่ใช่ URL
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (RETRYABLE_STATUS.has(res.status) && attempt < maxRetries) {
          lastError = new Error(`FB ${res.status}: ${text.slice(0, 200)}`);
          await sleep(2 ** attempt * 500);
          continue;
        }
        throw new Error(`FB Graph ${res.status}: ${text.slice(0, 300)}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort && attempt < maxRetries) {
        lastError = err as Error;
        await sleep(2 ** attempt * 500);
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error("fbFetch: exhausted retries");
}

export interface UploadInput {
  pageId: string;
  token: string;
  bytes: Uint8Array;
  filename?: string;
}

/**
 * upload ภาพแบบ unpublished (published=false) — ยังไม่ขึ้น feed, คืน media_fbid ไว้ publish ทีหลัง.
 * นี่คือขั้น "เตรียม media" ของ flow publish-on-approve.
 */
export async function uploadUnpublishedPhoto(input: UploadInput): Promise<string> {
  const form = new FormData();
  form.append("published", "false");
  // wrap new Uint8Array(...) → Uint8Array<ArrayBuffer> (BlobPart ที่ TS strict ยอมรับ — บทเรียน PR#85)
  form.append("source", new Blob([new Uint8Array(input.bytes)], { type: "image/png" }), input.filename ?? "image.png");

  const data = await fbFetch<{ id: string }>(`${input.pageId}/photos`, {
    token: input.token,
    method: "POST",
    body: form,
  });
  return data.id; // media_fbid
}

export interface PublishInput {
  pageId: string;
  token: string;
  mediaFbid: string;
  message: string;
}

/**
 * publish โพสต์ขึ้น feed โดยแนบรูปที่ upload ไว้ — เรียกตอน "approve" แล้ว.
 * publish-on-approve: POST /{page}/feed + attached_media[{media_fbid}]
 */
export async function publishToFeed(input: PublishInput): Promise<string> {
  const form = new FormData();
  form.append("message", input.message);
  form.append("attached_media[0]", JSON.stringify({ media_fbid: input.mediaFbid }));

  const data = await fbFetch<{ id: string }>(`${input.pageId}/feed`, {
    token: input.token,
    method: "POST",
    body: form,
  });
  return data.id; // post id
}
