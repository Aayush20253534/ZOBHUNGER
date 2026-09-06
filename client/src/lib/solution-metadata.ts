import type { Metadata } from "next";
import { site } from "@/data/site";
import { solutionDetails } from "@/data/solution-details";
import type { SolutionSlug } from "@/types/solution-detail.types";

export function getSolutionMetadata(slug: SolutionSlug): Metadata {
  const { heading, description } = solutionDetails[slug];
  const title = heading.replace(/\.$/, "");
  const url = `${site.url}/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: site.name,
      title: `${title} | ${site.name}`,
      description,
      url,
    },
  };
}
