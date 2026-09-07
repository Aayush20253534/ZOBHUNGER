import { ArrowRight, BriefcaseBusiness, MapPinned, UsersRound } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { CoreCapabilitiesSection } from "@/components/experience/CoreCapabilitiesSection";
import { ExperienceGroup } from "@/components/experience/ExperienceGroup";
import { WhyBrandsSection } from "@/components/experience/WhyBrandsSection";
import {
  brandExperienceGroups,
  brandExperienceIntro,
} from "@/data/brand-experience";
import "@/styles/experience.css";

const experiencePillars = [
  {
    icon: UsersRound,
    title: "People on the ground",
    description:
      "Manpower deployment, promoters, field teams and customer-facing execution around the assignment.",
  },
  {
    icon: MapPinned,
    title: "Execution across markets",
    description:
      "Field operations, audits, activation, onboarding and outreach shaped around different locations and project needs.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Project-led support",
    description:
      "Engagement built around the client brief, from acquisition and onboarding through training, activation and reporting.",
  },
] as const;

export function BrandExperiencePage() {
  return (
    <div className="zb-experience-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Brand experience" },
        ]}
      />

      <section className="zb-experience-hero" aria-labelledby="brand-experience-title">
        <PageShell
          eyebrow={brandExperienceIntro.eyebrow}
          title={brandExperienceIntro.title}
          description={brandExperienceIntro.description}
          actions={
            <ActionLink href="/contact">
              Discuss a project <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          }
        />
        <aside className="zb-experience-hero-panel" aria-label="Experience overview">
          <span className="zb-eyebrow">From brief to field execution</span>
          <h2>Built around real operating requirements.</h2>
          <p>
            Our experience spans customer acquisition, manpower deployment,
            audits, sampling, seller onboarding, training and consumer
            engagement across multiple sectors.
          </p>
        </aside>
      </section>

      <section
        className="zb-experience-section zb-experience-pillars"
        aria-label="Brand experience strengths"
      >
        {experiencePillars.map(({ icon: Icon, title, description }) => (
          <article key={title} className="zb-experience-pillar">
            <Icon aria-hidden="true" />
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section
        className="zb-experience-section"
        aria-labelledby="experience-groups-title"
      >
        <div className="zb-experience-section-heading">
          <div>
            <span className="zb-eyebrow">Across sectors</span>
            <h2 id="experience-groups-title">Selected brand experience.</h2>
          </div>
          <p>
            Organised by the kind of market and execution environment in which
            the work was delivered.
          </p>
        </div>
        <div className="zb-experience-groups">
          {brandExperienceGroups.map((group) => (
            <ExperienceGroup key={group.id} group={group} />
          ))}
        </div>
        <p className="zb-experience-note">
          Brand names are presented as project or execution experience and do
          not imply an exclusive or ongoing partnership.
        </p>
        <div className="zb-experience-case-link">
          <ActionLink href="/case-studies" variant="secondary">
            Explore case studies <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </div>
      </section>

      <CoreCapabilitiesSection />

      <WhyBrandsSection />

      <div className="zb-experience-section">
        <CTASection
          title="Need execution support for your next project?"
          description="Tell us the market, locations, team requirement and work you need delivered."
          href="/hire-workforce"
          label="Share your requirement"
        />
      </div>
    </div>
  );
}
