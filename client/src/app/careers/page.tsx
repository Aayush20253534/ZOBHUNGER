import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  Code2,
  GraduationCap,
  Handshake,
  Headset,
  MapPinned,
  Megaphone,
  MessagesSquare,
  Route,
  Search,
  UsersRound,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CareerImage } from "@/components/careers/CareerImage";
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
    focus: ["Plan", "Coordinate", "Deliver"],
    description:
      "Coordinate workforce delivery, field execution and day-to-day business operations across active requirements.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Sales & business development",
    focus: ["Connect", "Understand", "Grow"],
    description:
      "Build client relationships, understand business requirements and help turn opportunities into executable programs.",
  },
  {
    icon: UsersRound,
    title: "Recruitment & people operations",
    focus: ["Source", "Screen", "Onboard"],
    description:
      "Support sourcing, onboarding, coordination and workforce readiness across different roles and markets.",
  },
  {
    icon: Megaphone,
    title: "Marketing & brand growth",
    focus: ["Create", "Communicate", "Reach"],
    description:
      "Shape campaigns, communication and market-facing initiatives that strengthen how ZOBHUNGER reaches businesses and workers.",
  },
  {
    icon: Code2,
    title: "Technology & product",
    focus: ["Design", "Build", "Improve"],
    description:
      "Build and improve the digital systems that support workforce, operations, reporting and platform experiences.",
  },
  {
    icon: Headset,
    title: "Client & execution support",
    focus: ["Listen", "Resolve", "Follow up"],
    description:
      "Keep communication, coordination and delivery moving between businesses, teams and on-ground execution.",
  },
] as const;

const principles = [
  {
    icon: BadgeCheck,
    title: "Take ownership",
    description:
      "Take responsibility for the work, follow it through and keep the outcome in view.",
  },
  {
    icon: GraduationCap,
    title: "Learn through execution",
    description:
      "Build practical judgement through real briefs, team feedback and everyday problem solving.",
  },
  {
    icon: Handshake,
    title: "Work across teams",
    description:
      "Connect with people across recruitment, sales, operations, technology and client coordination.",
  },
  {
    icon: MapPinned,
    title: "Closer to the market",
    description:
      "Understand the people, places and business conditions behind every assignment.",
  },
] as const;

const hiringSteps = [
  {
    number: "01",
    icon: Search,
    title: "Role fit",
    description:
      "We look at the role, experience, strengths and the kind of work you want to take ownership of.",
  },
  {
    number: "02",
    icon: MessagesSquare,
    title: "Conversation",
    description:
      "Shortlisted candidates move into a focused discussion around expectations, responsibilities and working style.",
  },
  {
    number: "03",
    icon: ClipboardCheck,
    title: "Capability review",
    description:
      "Depending on the role, the process may include a practical discussion, work sample or role-relevant assessment.",
  },
  {
    number: "04",
    icon: BadgeCheck,
    title: "Joining & onboarding",
    description:
      "Selected candidates move into the role with clarity on responsibilities, reporting and the work ahead.",
  },
] as const;

export default function CareersPage() {
  return (
    <div className="zb-careers-page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Careers" }]} />

      <section className="zb-careers-hero" aria-label="Careers at ZOBHUNGER">
        <div className="zb-careers-hero-copy">
          <PageShell
            eyebrow="Careers at ZOBHUNGER"
            title="Build your career where execution happens."
            description="Bring your skills to the people, teams and markets behind everyday business. Find your path across operations, sales, recruitment and technology."
            actions={
              <>
                <ActionLink href="/careers/apply">
                  Submit your profile <ArrowDownRight aria-hidden="true" />
                </ActionLink>
                <ActionLink href="/jobs" variant="secondary">
                  View work opportunities
                </ActionLink>
              </>
            }
          />
        </div>

        <figure className="zb-careers-hero-visual">
          <CareerImage
            scene="team-collaboration"
            sizes="(min-width: 960px) 432px, (min-width: 520px) 480px, calc(100vw - 40px)"
            priority
          />
          <figcaption>
            <span className="zb-careers-caption-icon" aria-hidden="true"><UsersRound /></span>
            <div>
              <span className="zb-eyebrow">People behind the execution</span>
              <strong>Different roles. Shared purpose.</strong>
            </div>
          </figcaption>
        </figure>
      </section>

      <nav className="zb-careers-explore" aria-label="Explore careers">
        {[
          { href: "#career-areas", icon: BriefcaseBusiness, title: "Find your function", detail: "Explore career areas" },
          { href: "#life-at-zobhunger", icon: GraduationCap, title: "See how we work", detail: "People, learning & growth" },
          { href: "#hiring-journey", icon: Route, title: "Your hiring journey", detail: "From role fit to onboarding" },
        ].map(({ href, icon: Icon, title, detail }) => (
          <a href={href} key={href}>
            <span className="zb-careers-explore-icon" aria-hidden="true"><Icon /></span>
            <span><strong>{title}</strong><small>{detail}</small></span>
            <ArrowDownRight aria-hidden="true" />
          </a>
        ))}
      </nav>

      <section className="zb-section zb-careers-principles" id="life-at-zobhunger" aria-labelledby="careers-principles-title">
        <div className="zb-section-heading">
          <div>
            <span className="zb-eyebrow">How we work</span>
            <h2 id="careers-principles-title">Learn. Contribute. Grow.</h2>
          </div>
          <p>
            From the first brief to the next responsibility, build your
            experience through the work and the people around you.
          </p>
        </div>

        <div className="zb-careers-life-grid">
          <figure className="zb-careers-story-visual">
            <CareerImage
              scene="learning-together"
              sizes="(min-width: 1100px) 460px, (min-width: 900px) 42vw, (min-width: 680px) 600px, calc(100vw - 40px)"
            />
            <figcaption>
              <GraduationCap aria-hidden="true" />
              <span>Learning happens alongside the work.</span>
            </figcaption>
          </figure>
          <div className="zb-careers-principle-grid">
            {principles.map(({ icon: Icon, title, description }) => (
              <article className="zb-careers-principle-card" key={title}>
                <span className="zb-careers-card-icon" aria-hidden="true"><Icon /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
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
          {careerAreas.map(({ icon: Icon, title, description, focus }, index) => (
            <article className="zb-careers-area-card" key={title}>
              <div className="zb-careers-area-art" aria-hidden="true">
                <span className="zb-careers-area-icon"><Icon /></span>
                <span className="zb-careers-area-index">0{index + 1}</span>
                <Icon className="zb-careers-area-illustration" strokeWidth={1} />
              </div>
              <div className="zb-careers-area-copy">
                <h3>{title}</h3>
                <p>{description}</p>
                <ul className="zb-careers-area-focus" aria-label={`${title} focus`}>
                  {focus.map((item, itemIndex) => (
                    <li key={item}>
                      {itemIndex > 0 && <ChevronRight aria-hidden="true" />}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="zb-section zb-careers-work-options" aria-labelledby="work-options-title">
        <div className="zb-section-heading">
          <div>
            <span className="zb-eyebrow">Ways to work with us</span>
            <h2 id="work-options-title">Find your route into the work.</h2>
          </div>
          <p>
            Explore a role within ZOBHUNGER or find field, gig and client-linked
            opportunities through the platform.
          </p>
        </div>

        <div className="zb-careers-opportunity-layout">
          <figure className="zb-careers-story-visual zb-careers-field-visual">
            <CareerImage
              scene="field-opportunities"
              sizes="(min-width: 1100px) 520px, (min-width: 900px) 44vw, (min-width: 680px) 600px, calc(100vw - 40px)"
            />
            <figcaption>
              <MapPinned aria-hidden="true" />
              <span>Work that takes you into the market.</span>
            </figcaption>
          </figure>
          <div className="zb-careers-work-option-grid">
            <article className="zb-careers-work-option-card zb-careers-work-option-card--primary">
              <BriefcaseBusiness className="zb-careers-option-icon" aria-hidden="true" />
              <span className="zb-careers-option-label">ZOBHUNGER team</span>
              <h3>Corporate & operating roles</h3>
              <p>
                Build your path in operations, recruitment, sales, marketing,
                support or technology.
              </p>
              <div className="zb-careers-option-status">
                <span>Open roles are shared as positions become available.</span>
              </div>
              <ActionLink href="/careers/apply" variant="light">
                Submit your CV / profile <ArrowUpRight aria-hidden="true" />
              </ActionLink>
            </article>

            <article className="zb-careers-work-option-card">
              <MapPinned className="zb-careers-option-icon" aria-hidden="true" />
              <span className="zb-careers-option-label">Work opportunities</span>
              <h3>Field, gig & client-linked opportunities</h3>
              <p>
                Browse jobs, assignments and workforce opportunities available
                through our dedicated jobs experience.
              </p>
              <ActionLink href="/jobs" variant="secondary">
                Explore jobs & opportunities <ArrowUpRight aria-hidden="true" />
              </ActionLink>
            </article>
          </div>
        </div>
      </section>

      <section className="zb-section zb-careers-hiring" id="hiring-journey" aria-labelledby="careers-hiring-title">
        <div className="zb-section-heading">
          <div>
            <span className="zb-eyebrow">Hiring journey</span>
            <h2 id="careers-hiring-title">Your next chapter, step by step.</h2>
          </div>
          <p>
            The process can vary by role. Each step helps both sides understand
            fit, capability and expectations before the work begins.
          </p>
        </div>

        <ol className="zb-careers-hiring-steps" role="list">
          {hiringSteps.map(({ number, icon: Icon, title, description }) => (
            <li key={number} className="zb-careers-hiring-step">
              <span className="zb-careers-step-icon" aria-hidden="true"><Icon /></span>
              <div className="zb-careers-step-copy">
                <span className="zb-careers-step-number">Step {number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
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
          <ActionLink href="/careers/apply" variant="light">
            Submit your profile
          </ActionLink>
          <ActionLink href="/about" variant="secondary">
            About ZOBHUNGER
          </ActionLink>
        </div>
      </section>
    </div>
  );
}
