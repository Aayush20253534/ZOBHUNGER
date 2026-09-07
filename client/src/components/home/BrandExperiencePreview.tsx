import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import {
  brandExperienceIntro,
  featuredBrandExperience,
} from "@/data/brand-experience";

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
          title="Execution experience across familiar markets."
          description="From manpower deployment and seller onboarding to audits, sampling, lead generation and consumer engagement, our work has supported assignments across multiple sectors."
        />
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
      <div className="zb-home-brand-board" aria-label="Selected brand experience">
        <span className="zb-home-brand-board-label">Selected experience</span>
        <ul>
          {featuredBrandExperience.map((brand) => (
            <li key={brand}>{brand}</li>
          ))}
        </ul>
        <p>{brandExperienceIntro.eyebrow} across project-led assignments.</p>
      </div>
    </section>
  );
}
