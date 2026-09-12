import type { Metadata } from "next";
import { site } from "@/data/site";

const defaultSocialImage = `${site.url}/opengraph-image`;

export function getPageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = new URL(path, `${site.url}/`).toString();
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
      images: [{ url: defaultSocialImage, width: 1200, height: 630, alt: `${site.name} - ${title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [defaultSocialImage],
    },
  };
}
