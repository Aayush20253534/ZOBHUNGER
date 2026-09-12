import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/admin-access",
          "/admin-access/",
          "/business",
          "/business/",
          "/worker",
          "/worker/",
          "/placement-portal",
          "/placement-portal/",
          "/employee-joining",
          "/design-system",
          "/login",
          "/placement-cell-login",
          "/vendor-onboarding",
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
