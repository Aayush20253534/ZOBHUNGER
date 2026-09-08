import { CaseStudiesPage } from "@/components/case-studies/CaseStudiesPage";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Case Studies",
  "Explore selected ZOBHUNGER projects across field execution, onboarding, consumer engagement and business operations.",
  "/case-studies",
);

export default function Page() { return <CaseStudiesPage />; }
