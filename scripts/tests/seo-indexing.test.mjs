import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { checkSeoIndexing } from "../seo-indexing.mjs";

const canonical = "https://example.test";

function html({ canonicalUrl, robots = "index, follow", types = [] } = {}) {
  const schemas = types.map((type) => `<script type="application/ld+json">{"@context":"https://schema.org","@type":"${type}"}</script>`).join("");
  return `<!doctype html><html><head><link rel="canonical" href="${canonicalUrl}"><meta name="robots" content="${robots}">${schemas}</head><body>ZOBHUNGER</body></html>`;
}

function fetcher(url) {
  const parsed = new URL(url);
  if (parsed.pathname === "/api/release") return Promise.resolve(Response.json({ phase9SeoIndexing: true }));
  if (parsed.pathname === "/robots.txt") return Promise.resolve(new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /business\nDisallow: /worker\nDisallow: /placement-portal\nSitemap: ${canonical}/sitemap.xml\n`, { status: 200 }));
  if (parsed.pathname === "/sitemap.xml") return Promise.resolve(new Response(`<?xml version="1.0"?><urlset><url><loc>${canonical}/</loc></url><url><loc>${canonical}/jobs</loc></url><url><loc>${canonical}/blogs</loc></url><url><loc>${canonical}/jobs/live-role</loc></url><url><loc>${canonical}/blog/live-guide</loc></url></urlset>`, { status: 200 }));
  if (parsed.pathname === "/" && !parsed.search) return Promise.resolve(new Response(html({ canonicalUrl: `${canonical}/`, types: ["Organization", "WebSite"] }), { status: 200 }));
  if (parsed.pathname === "/jobs" && parsed.search) return Promise.resolve(new Response(html({ canonicalUrl: `${canonical}/jobs`, robots: "noindex, follow" }), { status: 200 }));
  if (parsed.pathname === "/blogs" && parsed.search) return Promise.resolve(new Response(html({ canonicalUrl: `${canonical}/blogs`, robots: "noindex, follow" }), { status: 200 }));
  if (parsed.pathname === "/jobs/live-role") return Promise.resolve(new Response(html({ canonicalUrl: `${canonical}/jobs/live-role`, types: ["BreadcrumbList", "JobPosting"] }), { status: 200 }));
  if (parsed.pathname === "/blog/live-guide") return Promise.resolve(new Response(html({ canonicalUrl: `${canonical}/blog/live-guide`, types: ["BreadcrumbList", "BlogPosting"] }), { status: 200 }));
  return Promise.resolve(new Response("not found", { status: 404 }));
}

test("live SEO gate verifies crawl controls, canonical URLs, sitemap and rich-result schemas", async () => {
  const report = await checkSeoIndexing(canonical, { fetcher });
  assert.equal(report.status, "passed");
  assert.equal(report.discovery.sitemapEntries, 5);
  assert.equal(report.discovery.dynamicJobs, 1);
  assert.equal(report.discovery.dynamicArticles, 1);
  assert.equal(report.structuredData.jobPosting, `${canonical}/jobs/live-role`);
  assert.equal(report.structuredData.blogPosting, `${canonical}/blog/live-guide`);
});

test("SEO gate rejects private URLs in the sitemap", async () => {
  await assert.rejects(
    checkSeoIndexing(canonical, {
      fetcher: async (url) => {
        const parsed = new URL(url);
        if (parsed.pathname === "/sitemap.xml") return new Response(`<?xml version="1.0"?><urlset><url><loc>${canonical}/</loc></url><url><loc>${canonical}/jobs</loc></url><url><loc>${canonical}/blogs</loc></url><url><loc>${canonical}/admin</loc></url></urlset>`);
        return fetcher(url);
      },
    }),
    /private\/noindex URL/,
  );
});

test("root metadata exposes Search Console verification and Organization plus WebSite schemas", async () => {
  const [layout, seo, env, release, rootPackage] = await Promise.all([
    readFile(new URL("../../client/src/app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/lib/seo.ts", import.meta.url), "utf8"),
    readFile(new URL("../../client/.env.example", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/app/api/release/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../../package.json", import.meta.url), "utf8"),
  ]);
  assert.ok(layout.includes("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"));
  assert.ok(layout.includes("organizationJsonLd()"));
  assert.ok(layout.includes("websiteJsonLd()"));
  assert.ok(seo.includes('"@type": "Organization"'));
  assert.ok(seo.includes('"@type": "WebSite"'));
  assert.ok(env.includes("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="));
  assert.ok(release.includes("phase9SeoIndexing: true"));
  assert.ok(rootPackage.includes('"test:seo"'));
  assert.ok(rootPackage.includes('"check:seo"'));
});

test("dynamic sitemap discovers published jobs and CMS articles while excluding demo/foreign canonical content", async () => {
  const sitemap = await readFile(new URL("../../client/src/app/sitemap.ts", import.meta.url), "utf8");
  for (const token of [
    'export const dynamic = "force-dynamic"',
    "collectPublishedJobs",
    "collectPublishedArticles",
    "!job.isDemo",
    "isSameSiteUrl(canonical)",
    "lastModified",
  ]) assert.ok(sitemap.includes(token), `sitemap missing ${token}`);
  assert.ok(!sitemap.includes('path: "/careers/apply"'));
});

test("job and article detail pages publish Google-friendly structured data", async () => {
  const [jobPage, articlePage, seo] = await Promise.all([
    readFile(new URL("../../client/src/app/jobs/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/app/blog/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/lib/seo.ts", import.meta.url), "utf8"),
  ]);
  assert.ok(jobPage.includes("jobPostingJsonLd(job)"));
  assert.ok(jobPage.includes("breadcrumbJsonLd"));
  assert.ok(articlePage.includes("blogPostingJsonLd(article"));
  assert.ok(articlePage.includes("breadcrumbJsonLd"));
  assert.ok(seo.includes('"@type": "JobPosting"'));
  assert.ok(seo.includes('"@type": "BlogPosting"'));
  assert.ok(seo.includes("directApply: true"));
});

test("filtered job/blog result pages are canonicalized and noindexed", async () => {
  const [jobs, blogs] = await Promise.all([
    readFile(new URL("../../client/src/app/jobs/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/app/blogs/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.ok(jobs.includes("filtered"));
  assert.ok(jobs.includes("index: false, follow: true"));
  assert.ok(blogs.includes("filtered"));
  assert.ok(blogs.includes("index: false, follow: true"));
});

test("robots, transport headers, social image and manifest cover the crawl surface", async () => {
  const [robots, nextConfig, socialImage, manifest] = await Promise.all([
    readFile(new URL("../../client/src/app/robots.ts", import.meta.url), "utf8"),
    readFile(new URL("../../client/next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/app/opengraph-image.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/app/manifest.ts", import.meta.url), "utf8"),
  ]);
  for (const path of ["/api/", "/admin", "/business", "/worker", "/placement-portal"]) assert.ok(robots.includes(`"${path}`));
  assert.ok(nextConfig.includes('"X-Robots-Tag", value: "noindex, follow"'));
  assert.ok(nextConfig.includes('source: "/careers/apply"'));
  assert.ok(socialImage.includes("1200"));
  assert.ok(socialImage.includes("630"));
  assert.ok(manifest.includes('theme_color: "#8d0d18"'));
});
