import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  // Sample pages carry noindex metadata. Allow crawlers to read that metadata.
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/design-system" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
