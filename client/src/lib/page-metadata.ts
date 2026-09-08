import type { Metadata } from "next";
import { site } from "@/data/site";

export function getPageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = site.url + path;
  const socialTitle = `${title} | ${site.name}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: site.name,
      title: socialTitle,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}
