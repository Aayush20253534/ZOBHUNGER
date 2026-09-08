import type { Metadata } from "next";
import { industries } from "@/data/industries";
import { industryDetails } from "@/data/industry-details";
import { getPageMetadata } from "@/lib/page-metadata";
import type { IndustryDetailContent } from "@/types/industry-detail.types";
import type { IndustrySlug } from "@/types/solution-detail.types";

export function getIndustryContent(slug: string) {
  const industry = industries.find((item) => item.slug === slug);
  if (!industry) return undefined;
  const detail: IndustryDetailContent = industryDetails[industry.slug];
  return { industry, detail };
}

export function getIndustryMetadata(slug: IndustrySlug): Metadata {
  const { heading, description } = industryDetails[slug];
  const title = heading.replace(/\.$/, "");
  return getPageMetadata(title, description, `/industries/${slug}`);
}
