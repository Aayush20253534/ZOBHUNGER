import { ArrowRight, BriefcaseBusiness, MapPinned, UsersRound } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { CoreCapabilitiesSection } from "@/components/experience/CoreCapabilitiesSection";
import { TrustedPartnerMarquee } from "@/components/experience/TrustedPartnerMarquee";
import { ExperienceProjectCard } from "@/components/experience/ExperienceProjectCard";
import { WhyBrandsSection } from "@/components/experience/WhyBrandsSection";
import { brandExperienceIntro } from "@/data/brand-experience";
import { caseStudies } from "@/data/case-studies";
import "@/styles/experience.css";

function ExperienceIconFallback() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

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
        <header className="zb-page-heading zb-experience-hero-copy">
          <span className="zb-eyebrow">{brandExperienceIntro.eyebrow}</span>
          <h1 id="brand-experience-title">{brandExperienceIntro.title}</h1>
          <p className="zb-page-description">{brandExperienceIntro.description}</p>
          <div className="zb-page-actions">
            <ActionLink href="/contact">
              Discuss a project <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          </div>
        </header>
        <aside className="zb-experience-hero-panel" aria-labelledby="experience-overview-title">
          <span className="zb-eyebrow">From brief to field execution</span>
          <h2 id="experience-overview-title">One team. Every step.</h2>
          <p>
            From your brief to teams in the market, with onboarding, field
            delivery and reporting managed together.
          </p>
          <ol className="zb-experience-hero-flow" aria-label="Typical execution pattern">
            {["Brief", "Mobilise", "Execute", "Report"].map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section
        className="zb-experience-section zb-experience-pillars"
        aria-label="Brand experience strengths"
      >
        {experiencePillars.map(({ icon: Icon, title, description }) => (
          <article key={title} className="zb-experience-pillar">
            {Icon ? <Icon aria-hidden="true" /> : <ExperienceIconFallback />}
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section
        className="zb-experience-section zb-experience-partners"
        aria-labelledby="experience-partners-title"
      >
        <h2 id="experience-partners-title">Our Trusted Partners</h2>
        <TrustedPartnerMarquee />
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
            <h2 id="experience-project-stories">Execution in practice.</h2>
          </div>
          <p>
            Explore the objective, field approach and delivery steps behind
            selected assignments.
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
