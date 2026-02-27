import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/shared/seo";

const STATIC_ROUTES = ["/", "/history", "/package", "/policy", "/profile", "/share", "/submitted"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return STATIC_ROUTES.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}