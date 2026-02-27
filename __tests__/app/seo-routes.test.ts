import { describe, expect, it, vi, afterEach } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("SEO metadata routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds robots with canonical sitemap on configured domain", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.maemormimi.com");

    expect(robots()).toEqual({
      rules: [{ userAgent: "*", allow: "/" }],
      sitemap: "https://www.maemormimi.com/sitemap.xml",
      host: "https://www.maemormimi.com",
    });
  });

  it("builds sitemap entries on configured domain", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.maemormimi.com");

    const items = sitemap();

    expect(items.length).toBeGreaterThan(0);
    expect(items.some((item) => item.url === "https://www.maemormimi.com/")).toBe(true);
    expect(items.some((item) => item.url === "https://www.maemormimi.com/share")).toBe(true);
  });
});