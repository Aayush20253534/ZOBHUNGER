import { ArrowRight, BriefcaseBusiness, MapPinned, UsersRound } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { CoreCapabilitiesSection } from "@/components/experience/CoreCapabilitiesSection";
import { BrandLogoMarquee } from "@/components/experience/BrandLogoMarquee";
import { ExperienceProjectCard } from "@/components/experience/ExperienceProjectCard";
import { WhyBrandsSection } from "@/components/experience/WhyBrandsSection";
import { brandExperienceIntro } from "@/data/brand-experience";
import { caseStudies } from "@/data/case-studies";
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
          <div className="zb-experience-hero-flow" aria-label="Typical execution pattern">
            {["Brief", "Mobilise", "Execute", "Report"].map((step, index) => (
              <div key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
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
            <h2 id="experience-groups-title">Execution experience across families & markets.</h2>
          </div>
          <p>
            All approved brand marks are presented together in one moving experience wall,
            with detailed project stories separated below.
          </p>
        </div>
        <BrandLogoMarquee />
        <div className="zb-experience-case-link">
          <ActionLink href="/case-studies" variant="secondary">
            Explore case studies <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </div>
      </section>

      <section className="zb-experience-section" aria-labelledby="experience-project-stories">
        <div className="zb-experience-section-heading">
          <div>
            <span className="zb-eyebrow">Project proof</span>
            <h2 id="experience-project-stories">See how the work was structured.</h2>
          </div>
          <p>
            Selected approved project stories connect the brand name to the actual
            objective, field execution and outcome rather than leaving proof as a logo wall.
          </p>
        </div>
        <div className="zb-experience-project-grid">
          {caseStudies.map((study) => (
            <ExperienceProjectCard key={study.slug} study={study} />
          ))}
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
