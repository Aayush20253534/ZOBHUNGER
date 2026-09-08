import type { Metadata } from "next";
import { CTASection } from "@/components/common/CTASection";
import { BrandExperiencePreview } from "@/components/home/BrandExperiencePreview";
import { Hero } from "@/components/home/Hero";
import { HomeCaseStudyProof } from "@/components/home/HomeCaseStudyProof";
import { HomeExecutionModel } from "@/components/home/HomeExecutionModel";
import { HomePresencePreview } from "@/components/home/HomePresencePreview";
import { IndustriesPreview } from "@/components/home/IndustriesPreview";
import { ServicesOverview } from "@/components/home/ServicesOverview";
import { WhyZobhunger } from "@/components/home/WhyZobhunger";
import { home } from "@/data/home";
import { site } from "@/data/site";
import "@/styles/solutions.css";
import "@/styles/home.css";

export const metadata: Metadata = {
  title: "Workforce, Sales & Business Execution",
  description: home.hero.description,
  alternates: { canonical: `${site.url}/` },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    url: `${site.url}/`,
    title: "ZOBHUNGER | Workforce, Sales & Business Execution",
    description: home.hero.description,
  },
};

export default function Page() {
  return (
    <div className="zb-home">
      <Hero />
      <BrandExperiencePreview />
      <ServicesOverview />
      <HomeExecutionModel />
      <IndustriesPreview />
      <HomeCaseStudyProof />
      <HomePresencePreview />
      <WhyZobhunger />
      <div className="zb-home-final-cta">
        <CTASection
          title="Need a workforce that can execute?"
          description="Share the role, market and work you need completed. We’ll help shape the right workforce and execution plan."
          href="/hire-workforce"
          label="Hire workforce"
        />
      </div>
    </div>
  );
}
