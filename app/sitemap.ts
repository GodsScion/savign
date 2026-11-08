import type { MetadataRoute } from "next";
import { SITE_UPDATED, absoluteUrl, routes } from "./lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.entries(routes).map(([path, route]) => ({
    url: absoluteUrl(path),
    lastModified: route.datePublished ?? SITE_UPDATED,
  }));
}
