import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  MapPinned,
  Megaphone,
  ScanSearch,
  Store,
  UsersRound,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { industries } from "@/data/industries";

const capabilities = [
  {
    title: "Workforce & deployment",
    description:
      "Build permanent, contract, project and on-demand teams around the work that needs to happen.",
    icon: UsersRound,
  },
  {
    title: "Sales & market execution",
    description:
      "Deploy field sales, telesales and merchant-facing teams for acquisition, activation and growth.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Retail execution & audits",
    description:
      "Support merchandising, store audits, visibility checks and structured field reporting.",
    icon: Store,
  },
  {
    title: "Brand activation",
    description:
      "Run sampling, promoter-led campaigns and on-ground consumer engagement with clear execution plans.",
    icon: Megaphone,
  },
] as const;

const reasons = [
  {
    title: "Requirement-led teams",
    description: "Roles, markets and outcomes are defined before sourcing begins.",
    icon: ScanSearch,
  },
  {
    title: "On-ground coordination",
    description: "Hiring, briefing, deployment and field activity stay connected.",
    icon: MapPinned,
  },
  {
    title: "Execution visibility",
    description: "Work is structured around agreed checkpoints, updates and reporting.",
    icon: BarChart3,
  },
  {
    title: "Flexible operating models",
    description: "Support can scale across campaigns, projects, seasonal demand and ongoing operations.",
    icon: ClipboardCheck,
  },
] as const;

export function HomeBusinessOverview() {
  return (
    <section
      className="zb-home-section zb-home-business-overview"
      aria-labelledby="home-business-overview-title"
    >
      <div className="zb-home-business-overview-head">
        <div>
          <p className="zb-eyebrow">What ZOBHUNGER brings together</p>
          <h2 id="home-business-overview-title">
            People, execution and market support in one operating model.
          </h2>
        </div>
        <p>
          From workforce deployment to retail execution, ZOBHUNGER helps
          businesses turn a requirement into an organised team and an
          on-ground plan.
        </p>
      </div>

      <div className="zb-home-business-overview-grid">
        <article className="zb-home-overview-panel zb-home-overview-panel--services">
          <div className="zb-home-overview-panel-head">
            <span className="zb-home-overview-kicker">01 · What we do</span>
            <ActionLink href="/solutions" variant="text">
              View all services
            </ActionLink>
          </div>
          <div className="zb-home-overview-capabilities">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="zb-home-overview-capability">
                  <span className="zb-home-overview-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="zb-home-overview-panel zb-home-overview-panel--why">
          <div className="zb-home-overview-panel-head">
            <span className="zb-home-overview-kicker">02 · Why choose us</span>
            <BadgeCheck aria-hidden="true" />
          </div>
          <h3 className="zb-home-overview-feature-title">
            Built around the work, not a generic staffing brief.
          </h3>
          <div className="zb-home-overview-reasons">
            {reasons.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title}>
                  <Icon aria-hidden="true" />
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <ActionLink href="/about" variant="light">
            Why ZOBHUNGER
          </ActionLink>
        </article>
      </div>

      <div className="zb-home-overview-industries">
        <div className="zb-home-overview-industries-copy">
          <span className="zb-home-overview-kicker">03 · Industries we cater</span>
          <h3>Execution shaped around how each market actually works.</h3>
          <p>
            A quick view of the sectors we support. Each industry page maps the
            relevant roles, activities and service combinations in more detail.
          </p>
          <ActionLink href="/industries" variant="text">
            Explore all industries
          </ActionLink>
        </div>

        <div className="zb-home-overview-industry-list" aria-label="Industries we serve">
          {industries.slice(0, 8).map((industry, index) => (
            <Link key={industry.slug} href={`/industries/${industry.slug}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {industry.title}
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ))}
          <Link href="/industries" className="zb-home-overview-industry-more">
            <span>+3</span>
            More industries
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
