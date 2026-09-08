import { CTASection } from "@/components/common/CTASection";
import { BrandExperiencePreview } from "@/components/home/BrandExperiencePreview";
import { Hero } from "@/components/home/Hero";
import { HomeCaseStudyProof } from "@/components/home/HomeCaseStudyProof";
import { HomeExecutionModel } from "@/components/home/HomeExecutionModel";
import { HomeExecutionStories } from "@/components/home/HomeExecutionStories";
import { HomeBusinessOverview } from "@/components/home/HomeBusinessOverview";
import { HomePresencePreview } from "@/components/home/HomePresencePreview";
import { home } from "@/data/home";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/solutions.css";
import "@/styles/home.css";

export const metadata = getPageMetadata(
  "Workforce, Sales & Business Execution",
  home.hero.description,
  "/",
);

export default function Page() {
  return (
    <div className="zb-home">
      <Hero />
      <BrandExperiencePreview />
      <HomeExecutionStories />
      <HomeBusinessOverview />
      <HomeExecutionModel />
      <HomeCaseStudyProof />
      <HomePresencePreview />
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
