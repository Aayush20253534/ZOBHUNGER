import { siteOrigin } from "./release-routes.mjs";

const PRIVATE_SITEMAP_PATTERNS = [
  "/admin",
  "/admin-access",
  "/business",
  "/worker",
  "/placement-portal",
  "/employee-joining",
  "/login",
  "/placement-cell-login",
  "/careers/apply",
  "/placement-cell-partnership/apply",
];

async function get(fetcher, url, accept = "text/html") {
  try {
    return await fetcher(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      credentials: "omit",
      headers: { Accept: accept },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(`GET ${url}: connection failed or timed out.`);
  }
}

function canonicalFromHtml(html) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return match?.[1] ?? null;
}

function robotsFromHtml(html) {
  const match = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/i);
  return (match?.[1] ?? "").toLowerCase();
}

function verificationFromHtml(html) {
  const match = html.match(/<meta[^>]+name=["']google-site-verification["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']google-site-verification["'][^>]*>/i);
  return match?.[1] ?? null;
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim());
}

function hasJsonLdType(html, type) {
  const escaped = type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\"@type\\"\\s*:\\s*\\"${escaped}\\"`, "i").test(html);
}

function normalizedAbsoluteUrl(value) {
  if (!value) return null;
  try {
    return new URL(value).href;
  } catch {
    return null;
  }
}

function assertCanonical(html, expected, label) {
  const canonical = canonicalFromHtml(html);
  const actualNormalized = normalizedAbsoluteUrl(canonical);
  const expectedNormalized = normalizedAbsoluteUrl(expected);
  if (!actualNormalized || !expectedNormalized || actualNormalized !== expectedNormalized) {
    throw new Error(`${label} canonical is ${canonical ?? "missing"}; expected ${expected}.`);
  }
  return canonical;
}

export async function checkSeoIndexing(origin, {
  fetcher = fetch,
  expectedGoogleVerification,
} = {}) {
  const canonical = siteOrigin(origin);
  const canonicalUrl = new URL(canonical);
  if (canonicalUrl.protocol !== "https:") throw new Error("SEO production checks require HTTPS.");

  const [homeResponse, robotsResponse, sitemapResponse, releaseResponse] = await Promise.all([
    get(fetcher, `${canonical}/`),
    get(fetcher, `${canonical}/robots.txt`, "text/plain"),
    get(fetcher, `${canonical}/sitemap.xml`, "application/xml,text/xml"),
    get(fetcher, `${canonical}/api/release`, "application/json"),
  ]);

  if (homeResponse.status !== 200) throw new Error(`Homepage returned ${homeResponse.status}.`);
  if (robotsResponse.status !== 200) throw new Error(`robots.txt returned ${robotsResponse.status}.`);
  if (sitemapResponse.status !== 200) throw new Error(`sitemap.xml returned ${sitemapResponse.status}.`);
  if (releaseResponse.status !== 200) throw new Error(`Release endpoint returned ${releaseResponse.status}.`);

  const [homeHtml, robotsText, sitemapXml, release] = await Promise.all([
    homeResponse.text(),
    robotsResponse.text(),
    sitemapResponse.text(),
    releaseResponse.json(),
  ]);

  if (release.phase9SeoIndexing !== true) throw new Error("Frontend is missing the Phase 9 SEO/indexing marker.");
  assertCanonical(homeHtml, `${canonical}/`, "Homepage");
  if (robotsFromHtml(homeHtml).includes("noindex")) throw new Error("Homepage is marked noindex.");
  if (!hasJsonLdType(homeHtml, "Organization")) throw new Error("Homepage is missing Organization JSON-LD.");
  if (!hasJsonLdType(homeHtml, "WebSite")) throw new Error("Homepage is missing WebSite JSON-LD.");

  const expectedSitemap = `${canonical}/sitemap.xml`;
  if (!new RegExp(`^Sitemap:\\s*${expectedSitemap.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "mi").test(robotsText)) {
    throw new Error(`robots.txt does not advertise ${expectedSitemap}.`);
  }
  for (const rule of ["/api/", "/admin", "/business", "/worker", "/placement-portal"]) {
    if (!robotsText.includes(`Disallow: ${rule}`)) throw new Error(`robots.txt is missing private-route rule ${rule}.`);
  }

  const locations = sitemapLocations(sitemapXml);
  if (!locations.includes(`${canonical}/`)) throw new Error("sitemap.xml does not contain the canonical homepage.");
  if (!locations.includes(`${canonical}/jobs`)) throw new Error("sitemap.xml does not contain /jobs.");
  if (!locations.includes(`${canonical}/blogs`)) throw new Error("sitemap.xml does not contain /blogs.");
  const foreign = locations.find((url) => {
    try { return new URL(url).origin !== canonical; } catch { return true; }
  });
  if (foreign) throw new Error(`sitemap.xml contains a foreign or invalid URL: ${foreign}.`);
  const privateEntry = locations.find((url) => PRIVATE_SITEMAP_PATTERNS.some((path) => new URL(url).pathname === path || new URL(url).pathname.startsWith(`${path}/`)));
  if (privateEntry) throw new Error(`sitemap.xml contains private/noindex URL ${privateEntry}.`);

  const [filteredJobs, filteredBlogs] = await Promise.all([
    get(fetcher, `${canonical}/jobs?query=seo-check`),
    get(fetcher, `${canonical}/blogs?query=seo-check`),
  ]);
  const [filteredJobsHtml, filteredBlogsHtml] = await Promise.all([filteredJobs.text(), filteredBlogs.text()]);
  if (!robotsFromHtml(filteredJobsHtml).includes("noindex")) throw new Error("Filtered jobs page is not marked noindex.");
  if (!robotsFromHtml(filteredBlogsHtml).includes("noindex")) throw new Error("Filtered blog page is not marked noindex.");
  assertCanonical(filteredJobsHtml, `${canonical}/jobs`, "Filtered jobs page");
  assertCanonical(filteredBlogsHtml, `${canonical}/blogs`, "Filtered blog page");

  const liveJob = locations.find((url) => new URL(url).pathname.startsWith("/jobs/") && new URL(url).pathname !== "/jobs/");
  const liveArticle = locations.find((url) => new URL(url).pathname.startsWith("/blog/"));
  const richResults = { jobPosting: null, blogPosting: null };

  if (liveJob) {
    const response = await get(fetcher, liveJob);
    if (response.status !== 200) throw new Error(`Sitemap job returned ${response.status}: ${liveJob}`);
    const html = await response.text();
    assertCanonical(html, liveJob, "Job page");
    if (!hasJsonLdType(html, "JobPosting")) throw new Error(`Live job is missing JobPosting JSON-LD: ${liveJob}`);
    richResults.jobPosting = liveJob;
  }

  if (liveArticle) {
    const response = await get(fetcher, liveArticle);
    if (response.status !== 200) throw new Error(`Sitemap article returned ${response.status}: ${liveArticle}`);
    const html = await response.text();
    if (!hasJsonLdType(html, "BlogPosting")) throw new Error(`Live article is missing BlogPosting JSON-LD: ${liveArticle}`);
    richResults.blogPosting = liveArticle;
  }

  const googleVerification = verificationFromHtml(homeHtml);
  if (expectedGoogleVerification && googleVerification !== expectedGoogleVerification) {
    throw new Error("Google Search Console verification meta value does not match the expected token.");
  }

  return {
    status: "passed",
    scope: "Phase 9 SEO metadata, crawl controls, canonical URLs, dynamic sitemap and structured data",
    canonicalOrigin: canonical,
    checkedAt: new Date().toISOString(),
    discovery: {
      sitemapEntries: locations.length,
      dynamicJobs: locations.filter((url) => new URL(url).pathname.startsWith("/jobs/")).length,
      dynamicArticles: locations.filter((url) => new URL(url).pathname.startsWith("/blog/")).length,
    },
    structuredData: {
      organization: true,
      website: true,
      ...richResults,
    },
    searchConsole: {
      verificationMetaPresent: Boolean(googleVerification),
      verificationTokenMatched: expectedGoogleVerification ? true : null,
      sitemapUrl: expectedSitemap,
    },
    notVerified: [
      "Google Search Console ownership acceptance",
      "Google crawl scheduling or indexing decisions",
      "Rich-result eligibility decisions made by Google",
      "Search ranking position",
    ],
  };
}
