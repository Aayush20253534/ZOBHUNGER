import { BrandExperiencePage } from "@/components/experience/BrandExperiencePage";
import { brandExperienceIntro } from "@/data/brand-experience";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Brand Experience",
  brandExperienceIntro.description,
  "/brand-experience",
);

export default function Page() {
  return <BrandExperiencePage />;
}
