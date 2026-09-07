import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  // Keep public marketing pages discoverable while excluding private workspaces.
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/design-system", "/admin", "/placement-portal"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
