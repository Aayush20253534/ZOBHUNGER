import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";
import { industries } from "@/data/industries";

/** Public service routes only. Extend from approved, published API content later. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/solutions",
    "/industries",
    "/for-business",
    "/for-workers",
    "/about",
    "/brand-experience",
    "/case-studies",
    "/contact",
    "/hire-workforce",
    "/how-it-works",
    "/technology",
    ...solutions.map((item) => `/${item.slug}`),
    ...industries.map((item) => `/industries/${item.slug}`),
  ];
  return paths.map((path) => ({ url: `${site.url}${path}` }));
}
