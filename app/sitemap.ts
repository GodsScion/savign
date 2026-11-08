import type { MetadataRoute } from "next";
import { absoluteUrl, lastModified, sitePages } from "./lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitePages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: lastModified(page.path),
  }));
}
