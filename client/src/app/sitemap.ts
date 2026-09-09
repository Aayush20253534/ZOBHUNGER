import type { MetadataRoute } from "next";
import { caseStudies } from "@/data/case-studies";
import { industries } from "@/data/industries";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";

const staticRoutes = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/solutions", priority: 0.95, changeFrequency: "monthly" },
  { path: "/industries", priority: 0.85, changeFrequency: "monthly" },
  { path: "/for-business", priority: 0.8, changeFrequency: "monthly" },
  { path: "/for-workers", priority: 0.75, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/presence", priority: 0.8, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.75, changeFrequency: "weekly" },
  { path: "/careers/apply", priority: 0.65, changeFrequency: "monthly" },
  { path: "/jobs", priority: 0.75, changeFrequency: "daily" },
  { path: "/blogs", priority: 0.8, changeFrequency: "weekly" },
  { path: "/brand-experience", priority: 0.8, changeFrequency: "monthly" },
  { path: "/case-studies", priority: 0.85, changeFrequency: "monthly" },
  { path: "/vendor-empanelment", priority: 0.75, changeFrequency: "monthly" },
  { path: "/become-a-partner", priority: 0.7, changeFrequency: "monthly" },
  {
    path: "/placement-cell-partnership",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
  { path: "/hire-workforce", priority: 0.95, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { path: "/technology", priority: 0.55, changeFrequency: "monthly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${site.url}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  routes.push(
    ...solutions.map((item) => ({
      url: `${site.url}/${item.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...industries.map((item) => ({
      url: `${site.url}/industries/${item.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...caseStudies.map((study) => ({
      url: `${site.url}/case-studies/${study.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  );

  return routes;
}
