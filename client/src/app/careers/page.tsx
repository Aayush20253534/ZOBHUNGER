import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  Code2,
  GraduationCap,
  Handshake,
  Headset,
  MapPinned,
  Megaphone,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/careers.css";

export const metadata = getPageMetadata(
  "Careers",
  "Explore career paths at ZOBHUNGER across operations, sales, recruitment, business development and technology.",
  "/careers",
);

const careerAreas = [
  {
    icon: Building2,
    title: "Operations",
    description:
      "Coordinate workforce delivery, field execution and day-to-day business operations across active requirements.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Sales & business development",
    description:
      "Build client relationships, understand business requirements and help turn opportunities into executable programs.",
  },
  {
    icon: UsersRound,
    title: "Recruitment & people operations",
    description:
      "Support sourcing, onboarding, coordination and workforce readiness across different roles and markets.",
  },
  {
    icon: Megaphone,
    title: "Marketing & brand growth",
    description:
      "Shape campaigns, communication and market-facing initiatives that strengthen how ZOBHUNGER reaches businesses and workers.",
  },
  {
    icon: Code2,
    title: "Technology & product",
    description:
      "Build and improve the digital systems that support workforce, operations, reporting and platform experiences.",
  },
  {
    icon: Headset,
    title: "Client & execution support",
    description:
      "Keep communication, coordination and delivery moving between businesses, teams and on-ground execution.",
  },
] as const;

const principles = [
  {
    icon: BadgeCheck,
    title: "Ownership over hand-offs",
    description:
      "Work is structured around taking responsibility for outcomes, not simply passing tasks between teams.",
  },
  {
    icon: GraduationCap,
    title: "Learn through execution",
    description:
      "Real business requirements create room to build practical judgement, operating discipline and market understanding.",
  },
  {
    icon: Handshake,
    title: "Cross-functional exposure",
    description:
      "Projects can connect recruitment, field operations, sales, technology and client coordination in the same execution cycle.",
  },
  {
    icon: MapPinned,
    title: "Closer to the market",
    description:
      "The work stays connected to the people, locations and business conditions where execution actually happens.",
  },
] as const;

const hiringSteps = [
  {
    number: "01",
    title: "Role fit",
    description:
      "We look at the role, experience, strengths and the kind of work you want to take ownership of.",
  },
  {
    number: "02",
    title: "Conversation",
    description:
      "Shortlisted candidates move into a focused discussion around expectations, responsibilities and working style.",
  },
  {
    number: "03",
    title: "Capability review",
    description:
      "Depending on the role, the process may include a practical discussion, work sample or role-relevant assessment.",
  },
  {
    number: "04",
    title: "Joining & onboarding",
    description:
      "Selected candidates move into the role with clarity on responsibilities, reporting and the work ahead.",
  },
] as const;

export default function CareersPage() {
  return (
    <div className="zb-careers-page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Careers" }]} />

      <section className="zb-careers-hero">
        <div className="zb-careers-hero-copy">
          <PageShell
            eyebrow="Careers at ZOBHUNGER"
            title="Build your career where execution happens."
            description="Work across workforce, sales, operations, recruitment, technology and business execution while helping turn real requirements into measurable delivery."
            actions={
              <>
                <ActionLink href="#career-areas">Explore career areas</ActionLink>
                <ActionLink href="/jobs" variant="secondary">
                  Explore work opportunities
                </ActionLink>
              </>
            }
          />
        </div>

        <aside className="zb-careers-path-panel" aria-label="Career pathways">
          <div className="zb-careers-path-panel-top">
            <span className="zb-careers-path-icon" aria-hidden="true">
              <BriefcaseBusiness />
            </span>
            <div>
              <span className="zb-eyebrow">Career pathways</span>
              <h2>Different functions. One execution mindset.</h2>
            </div>
          </div>

          <div className="zb-careers-path-list">
            {[
              ["01", "Operations & delivery"],
              ["02", "Sales & growth"],
              ["03", "Recruitment & people"],
              ["04", "Technology & product"],
            ].map(([number, label]) => (
              <div key={number} className="zb-careers-path-row">
                <span>{number}</span>
                <strong>{label}</strong>
                <ArrowRight aria-hidden="true" />
              </div>
            ))}
          </div>

          <p className="zb-careers-path-note">
            Roles may differ, but the work stays connected to business outcomes,
            coordination and delivery.
          </p>
        </aside>
      </section>

      <section className="zb-section zb-careers-principles" aria-labelledby="careers-principles-title">
        <div className="zb-section-heading">
          <div>
            <span className="zb-eyebrow">How we work</span>
            <h2 id="careers-principles-title">A practical environment built around responsibility and growth.</h2>
          </div>
          <p>
            ZOBHUNGER operates across people, markets and execution. That means
            the work rewards clarity, ownership, collaboration and a willingness
            to keep learning from real operating situations.
          </p>
        </div>

        <div className="zb-careers-principle-grid">
          {principles.map(({ icon: Icon, title, description }, index) => (
            <article className="zb-careers-principle-card" key={title}>
              <div className="zb-careers-card-top">
                <span className="zb-careers-card-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="zb-careers-card-index">0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="zb-section" id="career-areas" aria-labelledby="career-areas-title">
        <div className="zb-section-heading">
          <div>
            <span className="zb-eyebrow">Career areas</span>
            <h2 id="career-areas-title">Find the function where you can contribute best.</h2>
          </div>
          <p>
            Career opportunities can span corporate, operational and technology
            functions as ZOBHUNGER expands its execution capabilities.
          </p>
        </div>

        <div className="zb-careers-area-grid">
          {careerAreas.map(({ icon: Icon, title, description }) => (
            <article className="zb-careers-area-card" key={title}>
              <span className="zb-careers-area-icon" aria-hidden="true">
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="zb-section zb-careers-work-options" aria-labelledby="work-options-title">
        <div className="zb-careers-work-options-intro">
          <span className="zb-eyebrow">Ways to work with us</span>
          <h2 id="work-options-title">Choose the opportunity path that fits you.</h2>
          <p>
            We keep the two paths clear so you can reach the right opportunity
            without wandering through unrelated listings.
          </p>
        </div>

        <div className="zb-careers-work-option-grid">
          <article className="zb-careers-work-option-card zb-careers-work-option-card--primary">
            <span className="zb-careers-option-label">ZOBHUNGER team</span>
            <h3>Corporate & operating roles</h3>
            <p>
              Roles within ZOBHUNGER can include operations, recruitment, sales,
              business development, marketing, support and technology functions.
            </p>
            <div className="zb-careers-option-status">
              <Sparkles aria-hidden="true" />
              <span>Open roles are shared as positions become available.</span>
            </div>
            <ActionLink href="/contact" variant="light">
              Contact ZOBHUNGER
            </ActionLink>
          </article>

          <article className="zb-careers-work-option-card">
            <span className="zb-careers-option-label">Work opportunities</span>
            <h3>Field, gig & client-linked opportunities</h3>
            <p>
              Looking for jobs, assignments, flexible work or workforce
              opportunities available through the platform? Use the dedicated
              jobs experience instead.
            </p>
            <ActionLink href="/jobs" variant="secondary">
              Explore jobs & opportunities
            </ActionLink>
          </article>
        </div>
      </section>

      <section className="zb-section zb-careers-hiring" aria-labelledby="careers-hiring-title">
        <div className="zb-careers-hiring-copy">
          <span className="zb-eyebrow">Hiring journey</span>
          <h2 id="careers-hiring-title">A clear process from interest to onboarding.</h2>
          <p>
            The exact process can vary by role, but the objective stays simple:
            understand fit, evaluate capability and set expectations before the
            work begins.
          </p>
          <ActionLink href="/about" variant="secondary">
            Learn about ZOBHUNGER
          </ActionLink>
        </div>

        <div className="zb-careers-hiring-steps">
          {hiringSteps.map((step) => (
            <article key={step.number} className="zb-careers-hiring-step">
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="zb-careers-final-cta" aria-labelledby="careers-final-title">
        <div>
          <span className="zb-eyebrow">Explore what fits</span>
          <h2 id="careers-final-title">Ready to find your place in the work?</h2>
          <p>
            Explore available work opportunities or get to know ZOBHUNGER before
            deciding which path is right for you.
          </p>
        </div>
        <div className="zb-careers-final-actions">
          <ActionLink href="/jobs" variant="light">
            View opportunities
          </ActionLink>
          <ActionLink href="/about" variant="secondary">
            About ZOBHUNGER
          </ActionLink>
        </div>
      </section>
    </div>
  );
}
