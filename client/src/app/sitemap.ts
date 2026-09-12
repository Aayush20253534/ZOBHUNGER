import type { MetadataRoute } from "next";
import { caseStudies } from "@/data/case-studies";
import { industries } from "@/data/industries";
import { site } from "@/data/site";
import { solutionHref, solutions } from "@/data/solutions";
import { isSameSiteUrl } from "@/lib/seo";
import { getArticles } from "@/services/articles.service";
import { getJobs } from "@/services/jobs.service";
import type { ArticleSummary } from "@/types/article.types";
import type { Job } from "@/types/job.types";

// Jobs and CMS articles change independently of frontend deployments. Keeping
// the sitemap dynamic means crawlers can discover newly published content
// without waiting for the next Vercel build.
export const dynamic = "force-dynamic";

const staticRoutes = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/solutions", priority: 0.95, changeFrequency: "monthly" },
  { path: "/industries", priority: 0.85, changeFrequency: "monthly" },
  { path: "/for-business", priority: 0.8, changeFrequency: "monthly" },
  { path: "/for-workers", priority: 0.75, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/presence", priority: 0.8, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.75, changeFrequency: "weekly" },
  { path: "/jobs", priority: 0.82, changeFrequency: "daily" },
  { path: "/blogs", priority: 0.82, changeFrequency: "daily" },
  { path: "/brand-experience", priority: 0.8, changeFrequency: "monthly" },
  { path: "/case-studies", priority: 0.85, changeFrequency: "monthly" },
  { path: "/vendor-empanelment", priority: 0.75, changeFrequency: "monthly" },
  { path: "/become-a-partner", priority: 0.7, changeFrequency: "monthly" },
  { path: "/placement-cell-partnership", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
  { path: "/hire-workforce", priority: 0.95, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { path: "/technology", priority: 0.55, changeFrequency: "monthly" },
] as const;

function dateValue(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function collectPublishedJobs() {
  const items: Job[] = [];
  let page = 1;
  const pageSize = 100;

  while (page <= 50) {
    const result = await getJobs({ page, pageSize });
    items.push(...result.items.filter((job) => job.isPublished && !job.isDemo));
    if (page >= result.totalPages) break;
    page += 1;
  }

  return items;
}

async function collectPublishedArticles() {
  const items: ArticleSummary[] = [];
  let page = 1;
  const pageSize = 100;

  while (page <= 50) {
    const result = await getArticles({ page, pageSize });
    items.push(...result.items.filter((article) => article.isPublished));
    if (page >= result.totalPages) break;
    page += 1;
  }

  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: new URL(route.path || "/", `${site.url}/`).toString(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  routes.push(
    ...solutions.map((item) => ({
      url: `${site.url}${solutionHref(item.slug)}`,
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

  // A backend outage must not turn /sitemap.xml into a 500. Static discovery
  // remains available and dynamic entries return automatically once the API is
  // healthy again.
  const [jobs, articles] = await Promise.all([
    collectPublishedJobs().catch(() => [] as Job[]),
    collectPublishedArticles().catch(() => [] as ArticleSummary[]),
  ]);

  routes.push(
    ...jobs.map((job) => ({
      url: `${site.url}/jobs/${encodeURIComponent(job.slug)}`,
      lastModified: dateValue(job.updatedAt || job.publishedAt || job.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.72,
    })),
    ...articles.flatMap((article) => {
      const localUrl = `${site.url}/blog/${encodeURIComponent(article.slug)}`;
      const canonical = article.canonicalUrl || localUrl;
      if (!isSameSiteUrl(canonical)) return [];
      return [{
        url: canonical,
        lastModified: dateValue(article.updatedAt || article.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }];
    }),
  );

  // Defensive de-duplication protects against a CMS canonical URL colliding
  // with a static route or a future route alias.
  return Array.from(new Map(routes.map((entry) => [entry.url, entry])).values());
}
