import type { Metadata } from "next";
import { CaseStudiesPage } from "@/components/case-studies/CaseStudiesPage";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "Explore selected ZOBHUNGER projects across field execution, onboarding, consumer engagement and business operations.",
  alternates: { canonical: `${site.url}/case-studies` },
};

export default function Page() { return <CaseStudiesPage />; }
