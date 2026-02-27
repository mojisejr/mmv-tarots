import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_URL, resolveAbsoluteUrl, resolveSiteUrl } from "@/lib/shared/seo";

describe("SEO URL utilities", () => {
  it("returns default site URL when input is empty", () => {
    expect(resolveSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
    expect(resolveSiteUrl("")).toBe(DEFAULT_SITE_URL);
  });

  it("normalizes domain without protocol", () => {
    expect(resolveSiteUrl("www.maemormimi.com")).toBe("https://www.maemormimi.com");
  });

  it("keeps valid URL and trims trailing slash", () => {
    expect(resolveSiteUrl("https://www.maemormimi.com/")).toBe("https://www.maemormimi.com");
  });

  it("falls back to default when URL is invalid", () => {
    expect(resolveSiteUrl("::::invalid::::")).toBe(DEFAULT_SITE_URL);
  });

  it("resolves absolute URL from path", () => {
    expect(resolveAbsoluteUrl("/sitemap.xml", "https://www.maemormimi.com")).toBe(
      "https://www.maemormimi.com/sitemap.xml"
    );
  });
});