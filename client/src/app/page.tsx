import type { Metadata } from "next";
import { CTASection } from "@/components/common/CTASection";
import { AudienceSection } from "@/components/home/AudienceSection";
import { BrandExperiencePreview } from "@/components/home/BrandExperiencePreview";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { IndustriesPreview } from "@/components/home/IndustriesPreview";
import { ServicesOverview } from "@/components/home/ServicesOverview";
import { TechnologyPreview } from "@/components/home/TechnologyPreview";
import { WhyZobhunger } from "@/components/home/WhyZobhunger";
import { home } from "@/data/home";
import { site } from "@/data/site";
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
      <ServicesOverview />
      <WhyZobhunger />
      <HowItWorks />
      <IndustriesPreview />
      <BrandExperiencePreview />
      <AudienceSection />
      <TechnologyPreview />
      <div className="zb-home-final-cta">
        <CTASection
          title={home.cta.title}
          description={home.cta.description}
          href="/contact"
          label="Talk to our team"
        />
      </div>
    </div>
  );
}
