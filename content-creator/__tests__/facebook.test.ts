import { afterEach, describe, expect, it, vi } from "vitest";
import { fbFetch, uploadUnpublishedPhoto, publishToFeed } from "../lib/facebook";

const okJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => vi.restoreAllMocks());

describe("fbFetch — security & robustness (Gate B)", () => {
  it("[SEC] ส่ง token ใน Authorization header ไม่ใช่ใน URL", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okJson({ id: "1" }));
    await fbFetch("123/photos", { token: "SECRET", method: "POST" });

    const [url, init] = spy.mock.calls[0];
    expect(String(url)).not.toContain("SECRET"); // token ไม่อยู่ใน URL
    expect(String(url)).not.toContain("access_token");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer SECRET" });
  });

  it("ใช้ GRAPH_VERSION จาก config ใน URL", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okJson({ id: "1" }));
    await fbFetch("123/feed", { token: "t" });
    expect(String(spy.mock.calls[0][0])).toMatch(/graph\.facebook\.com\/v\d+/);
  });

  it("retry เมื่อเจอ 429 แล้วสำเร็จ", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(okJson({ error: "rate" }, 429))
      .mockResolvedValueOnce(okJson({ id: "ok" }));
    const out = await fbFetch<{ id: string }>("123/feed", { token: "t", maxRetries: 2 });
    expect(out.id).toBe("ok");
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("throw ทันทีเมื่อ 400 (non-retryable) — ไม่ retry", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okJson({ error: "bad" }, 400));
    await expect(fbFetch("123/feed", { token: "t" })).rejects.toThrow(/FB Graph 400/);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("throw เมื่อ res.ok=false (ไม่เรียก .json() กำกวม)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("<!DOCTYPE html>500", { status: 500 }));
    await expect(fbFetch("x", { token: "t", maxRetries: 0 })).rejects.toThrow(/FB Graph 500/);
  });
});

describe("uploadUnpublishedPhoto — เตรียม media (publish-on-approve)", () => {
  it("ส่ง published=false + ไม่มี access_token ใน body, คืน media_fbid", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okJson({ id: "media_99" }));
    const id = await uploadUnpublishedPhoto({ pageId: "P", token: "t", bytes: new Uint8Array([1, 2, 3]) });

    expect(id).toBe("media_99");
    const form = (spy.mock.calls[0][1] as RequestInit).body as FormData;
    expect(form.get("published")).toBe("false");
    expect(form.get("access_token")).toBeNull(); // token ไม่อยู่ใน body (อยู่ header)
    expect(String(spy.mock.calls[0][0])).toContain("P/photos");
  });
});

describe("publishToFeed — publish ตอน approve", () => {
  it("แนบ attached_media[0] ด้วย media_fbid, คืน post id", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okJson({ id: "post_1" }));
    const id = await publishToFeed({ pageId: "P", token: "t", mediaFbid: "media_99", message: "hi" });

    expect(id).toBe("post_1");
    const form = (spy.mock.calls[0][1] as RequestInit).body as FormData;
    expect(form.get("message")).toBe("hi");
    expect(JSON.parse(String(form.get("attached_media[0]")))).toEqual({ media_fbid: "media_99" });
    expect(String(spy.mock.calls[0][0])).toContain("P/feed");
  });
});
