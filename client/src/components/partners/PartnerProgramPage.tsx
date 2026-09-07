import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Handshake,
  MapPinned,
  Sparkles,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { SectionHeading } from "@/components/common/SectionHeading";
import {
  partnerContributions,
  partnerEarningModels,
  partnerFreedomPoints,
  partnerProcess,
  partnerProfiles,
  partnerProgramIntro,
} from "@/data/partner-program";
import "@/styles/partner.css";

export function PartnerProgramPage() {
  return (
    <div className="zb-partner-page">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Become a Partner" }]}
      />

      <section className="zb-partner-hero" aria-labelledby="partner-hero-title">
        <header className="zb-page-heading">
          <span className="zb-eyebrow">{partnerProgramIntro.eyebrow}</span>
          <h1 id="partner-hero-title">{partnerProgramIntro.title}</h1>
          <p className="zb-partner-hero-subtitle">{partnerProgramIntro.subtitle}</p>
          <p className="zb-page-description">{partnerProgramIntro.description}</p>
          <div className="zb-page-actions">
            <ActionLink href="#partner-application">
              Explore partnership opportunities
              <ArrowDown className="size-4" aria-hidden="true" />
            </ActionLink>
            <ActionLink href="/contact" variant="secondary">
              Talk to our team
            </ActionLink>
          </div>
        </header>

        <aside className="zb-partner-hero-card" aria-label="Partner program summary">
          <span className="zb-partner-hero-icon" aria-hidden="true">
            <Handshake />
          </span>
          <span className="zb-eyebrow">Built around contribution</span>
          <h2>Independent by design. Connected by opportunity.</h2>
          <p>
            Bring expertise, networks or business opportunities. ZOBHUNGER
            supports the execution through its workforce and operating
            capabilities.
          </p>
          <div className="zb-partner-hero-facts">
            <div>
              <BriefcaseBusiness aria-hidden="true" />
              <span>Professional independence</span>
            </div>
            <div>
              <MapPinned aria-hidden="true" />
              <span>Pan-India opportunities</span>
            </div>
            <div>
              <BadgeCheck aria-hidden="true" />
              <span>Contribution-led commercials</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="zb-partner-section zb-partner-not-job" aria-labelledby="partner-not-job-title">
        <div>
          <span className="zb-eyebrow">A different way to collaborate</span>
          <h2 id="partner-not-job-title">Not Just a Job. A Partnership Opportunity.</h2>
        </div>
        <div>
          <p>
            Our Independent Business Partner Program is designed for experienced
            professionals who want to work with flexibility and freedom.
          </p>
          <p>
            You are not required to leave your existing job, business,
            consulting practice or professional commitments. You can continue
            working with other organizations while collaborating with us based
            on your expertise, availability and mutually agreed opportunities.
          </p>
        </div>
      </section>

      <section className="zb-partner-section" aria-labelledby="partner-profile-title">
        <SectionHeading
          id="partner-profile-title"
          eyebrow="Who can become a partner?"
          title="Experience from different disciplines can create value."
          description="The program is open to experienced professionals, specialists and business builders who can contribute knowledge, access or execution support."
        />
        <div className="zb-partner-profile-grid">
          {partnerProfiles.map(({ title, icon: Icon }) => (
            <article className="zb-partner-profile-card" key={title}>
              <span className="zb-partner-icon-tile" aria-hidden="true">
                <Icon />
              </span>
              <h3>{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="zb-partner-section zb-partner-contribute" aria-labelledby="partner-contribute-title">
        <SectionHeading
          id="partner-contribute-title"
          eyebrow="How you can contribute"
          title="Bring what you know. Build what the opportunity needs."
          description="Contributions can begin with a client introduction, specialist knowledge, market development or direct support across sales, workforce and project execution."
        />
        <div className="zb-partner-contribution-grid">
          {partnerContributions.map((item, index) => (
            <article key={item}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h3>{item}</h3>
              <ArrowRight aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className="zb-partner-section zb-partner-freedom" aria-labelledby="partner-freedom-title">
        <div className="zb-partner-freedom-copy">
          <span className="zb-eyebrow">Work with freedom</span>
          <h2 id="partner-freedom-title">Professional flexibility stays part of the model.</h2>
          <p>
            The relationship is structured around relevant opportunities and
            contribution, not around traditional full-time employment.
          </p>
        </div>
        <ul>
          {partnerFreedomPoints.map((point) => (
            <li key={point}>
              <span aria-hidden="true"><Check /></span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="zb-partner-section" aria-labelledby="partner-earn-title">
        <SectionHeading
          id="partner-earn-title"
          eyebrow="Commercial model"
          title="Earn Based on Your Contribution"
          description="For projects, clients or business opportunities where your contribution is formally recognized, the commercial structure may be agreed around one of these models."
        />
        <div className="zb-partner-earning-grid">
          {partnerEarningModels.map(({ title, icon: Icon }) => (
            <article key={title}>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
            </article>
          ))}
        </div>
        <div className="zb-partner-disclaimer" role="note" aria-label="Important earning disclaimer">
          <strong>Important disclaimer</strong>
          <p>
            This is not a fixed salary or employment opportunity. Earnings are
            project-based and depend on actual contribution, business
            performance, client payments and mutually agreed terms.
          </p>
        </div>
      </section>

      <section className="zb-partner-section zb-partner-strength" aria-labelledby="partner-strength-title">
        <div className="zb-partner-strength-mark" aria-hidden="true">
          <Sparkles />
        </div>
        <div>
          <span className="zb-eyebrow">Our strength</span>
          <h2 id="partner-strength-title">You Bring the Expertise. We Support the Execution.</h2>
          <p>
            ZOBHUNGER has capabilities across manpower, recruitment, workforce
            management, operations, sales support and project execution. We are
            building a network of Independent Business Partners who can bring
            expertise, industry knowledge, professional networks and business
            opportunities while our team supports execution and delivery.
          </p>
        </div>
      </section>

      <section className="zb-partner-section" aria-labelledby="partner-process-title">
        <SectionHeading
          id="partner-process-title"
          eyebrow="How it works"
          title="A simple path from introduction to collaboration."
        />
        <ol className="zb-partner-process">
          {partnerProcess.map((item) => (
            <li key={item.step}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="partner-application" className="zb-partner-section zb-partner-application" aria-labelledby="partner-application-title">
        <div>
          <span className="zb-eyebrow">Partner application</span>
          <h2 id="partner-application-title">Ready to explore a partnership?</h2>
          <p>
            Tell us about your professional background, specialization and how
            you would like to contribute. The application is designed to help
            our team understand where a relevant collaboration may exist.
          </p>
        </div>
        <div className="zb-partner-application-summary">
          <span>Application will include</span>
          <ul>
            <li>Professional profile &amp; experience</li>
            <li>Specialization &amp; industry background</li>
            <li>Preferred contribution &amp; partnership area</li>
            <li>Optional LinkedIn and resume/profile</li>
          </ul>
          <ActionLink href="/contact" variant="secondary">
            Apply to Become a Partner
          </ActionLink>
        </div>
      </section>

      <div className="zb-partner-section">
        <CTASection
          title="Build opportunities without giving up your independence."
          description="Explore a flexible professional relationship built around expertise, business contribution and mutually agreed projects."
          href="#partner-application"
          label="Explore partnership opportunities"
        />
      </div>
    </div>
  );
}
