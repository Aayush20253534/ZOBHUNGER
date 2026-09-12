import type { Job } from "@/types/job.types";
import type { Article } from "@/types/article.types";
import { market } from "@/data/market";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";

export interface BreadcrumbItem {
  name: string;
  path?: string;
  url?: string;
}

function absoluteUrl(pathOrUrl: string) {
  try {
    return new URL(pathOrUrl, `${site.url}/`).toString();
  } catch {
    return site.url;
  }
}

export function canonicalUrl(path: string) {
  return absoluteUrl(path);
}

export function isSameSiteUrl(value: string) {
  try {
    return new URL(value).origin === new URL(site.url).origin;
  } catch {
    return false;
  }
}

/** JSON-LD must never be allowed to terminate the script element. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: {
      "@type": "ImageObject",
      url: `${site.url}/Logo/Logo.png`,
      width: 1254,
      height: 1254,
    },
    description: site.description,
    slogan: site.tagline,
    email: site.publicContact.email,
    telephone: site.publicContact.phoneLabel,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.publicContact.streetAddress,
      addressLocality: site.publicContact.addressLocality,
      addressRegion: site.publicContact.addressRegion,
      postalCode: site.publicContact.postalCode,
      addressCountry: site.publicContact.addressCountry,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: site.publicContact.email,
      telephone: site.publicContact.phoneLabel,
      areaServed: market.operatingCountries.map((country) => country.name),
    },
    knowsAbout: Array.from(
      new Set(
        solutions.flatMap((solution) => [solution.title, ...solution.services]),
      ),
    ),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: "en-IN",
    publisher: { "@id": `${site.url}/#organization` },
  };
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ?? canonicalUrl(item.path ?? "/"),
    })),
  };
}

function employmentType(value: string) {
  const normalized = value.trim().toLocaleLowerCase("en-IN");
  if (normalized.includes("full")) return "FULL_TIME";
  if (normalized.includes("part")) return "PART_TIME";
  if (normalized.includes("intern")) return "INTERN";
  if (normalized.includes("temporary") || normalized.includes("project") || normalized.includes("gig")) return "TEMPORARY";
  if (normalized.includes("contract")) return "CONTRACTOR";
  return undefined;
}

export function jobPostingJsonLd(job: Job) {
  const url = canonicalUrl(`/jobs/${encodeURIComponent(job.slug)}`);
  const postedAt = job.publishedAt || job.createdAt;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${url}#jobposting`,
    title: job.title,
    description: job.description,
    responsibilities: job.responsibilities?.length ? job.responsibilities.join("\n") : undefined,
    qualifications: job.requirements?.length ? job.requirements.join("\n") : undefined,
    industry: job.category,
    datePosted: postedAt,
    employmentType: employmentType(job.jobType),
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: site.name,
      value: job.id,
    },
    hiringOrganization: {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      sameAs: site.url,
      logo: `${site.url}/Logo/Logo.png`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city || job.location,
        addressRegion: job.state || undefined,
        addressCountry: market.primaryMarket.countryCode,
      },
    },
    url,
  };
}

export function blogPostingJsonLd(article: Article, image?: string) {
  const localUrl = canonicalUrl(`/blog/${encodeURIComponent(article.slug)}`);
  const canonical = article.canonicalUrl || localUrl;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonical}#article`,
    headline: article.title,
    description: article.seoDescription || article.excerpt,
    articleSection: article.category,
    keywords: article.tags?.length ? article.tags.join(", ") : undefined,
    image,
    datePublished: article.publishedAt || undefined,
    dateModified: article.updatedAt || article.publishedAt || undefined,
    author: article.authorName
      ? { "@type": "Person", name: article.authorName }
      : { "@id": `${site.url}/#organization` },
    publisher: {
      "@id": `${site.url}/#organization`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    inLanguage: "en-IN",
    url: canonical,
  };
}
