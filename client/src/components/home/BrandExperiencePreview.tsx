import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { BrandLogoMarquee } from "@/components/experience/BrandLogoMarquee";
import { SectionHeading } from "@/components/common/SectionHeading";
import { brandExperienceIntro } from "@/data/brand-experience";

export function BrandExperiencePreview() {
  return (
    <section
      className="zb-home-section zb-home-experience"
      aria-labelledby="home-experience-heading"
    >
      <div className="zb-home-experience-intro">
        <SectionHeading
          id="home-experience-heading"
          eyebrow="Brand experience"
          title="Execution experience across families & markets."
          description="From manpower deployment and seller onboarding to audits, sampling, lead generation and consumer engagement, our work has supported assignments across multiple sectors."
        />
        <div className="zb-home-experience-meta">
          <div className="zb-home-experience-proof">
            <BriefcaseBusiness aria-hidden="true" />
            <p>
              Project experience across e-commerce, logistics, fintech, banking,
              retail, food & beverage and digital services.
            </p>
          </div>
          <ActionLink href="/brand-experience" variant="secondary">
            Explore brand experience
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </div>
      </div>
      <div className="zb-home-brand-board" aria-label="Execution experience across families and markets">
        <span className="zb-home-brand-board-label">Execution experience across families & markets</span>
        <BrandLogoMarquee compact />
        <p>{brandExperienceIntro.eyebrow} across project-led assignments.</p>
      </div>
    </section>
  );
}
