import type { Metadata } from "next";
import { BrandExperiencePage } from "@/components/experience/BrandExperiencePage";
import { brandExperienceIntro } from "@/data/brand-experience";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Brand Experience",
  description: brandExperienceIntro.description,
  alternates: { canonical: `${site.url}/brand-experience` },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    url: `${site.url}/brand-experience`,
    title: "Brand Experience | ZOBHUNGER",
    description: brandExperienceIntro.description,
  },
};

export default function Page() {
  return <BrandExperiencePage />;
}
