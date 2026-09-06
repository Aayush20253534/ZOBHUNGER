import type { Metadata } from "next";
import { site } from "@/data/site";

export function getPageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = site.url + path;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: site.name,
      title: title + " | " + site.name,
      description,
      url,
    },
  };
}
