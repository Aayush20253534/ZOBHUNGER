import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Megaphone,
  Store,
  Users,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/card";
import {
  briefChecklist,
  businessNeeds,
  businessQuestions,
} from "@/data/company";
import "@/styles/company.css";

const icons = {
  workforce: Users,
  sales: BriefcaseBusiness,
  promoters: Megaphone,
  execution: Store,
};

export function ForBusiness() {
  return (
    <div className="zb-company">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "For Business" }]}
      />
      <div className="zb-company-hero">
        <PageShell
          eyebrow="For business"
          title="Build and manage your team with ZOBHUNGER."
          description="Bring your workforce, sales and market execution needs into one conversation. Tell us the work ahead, and shape a team around it."
          actions={
            <>
              <ActionLink href="/hire-workforce">
                Tell us what you need{" "}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </ActionLink>
              <ActionLink href="/solutions" variant="secondary">
                Explore solutions
              </ActionLink>
            </>
          }
        />
        <aside className="zb-premium-hero-card zb-business-hero-card" aria-labelledby="business-summary-title">
          <div className="zb-premium-card-header">
            <span className="zb-premium-card-icon" aria-hidden="true">
              <BriefcaseBusiness />
            </span>
            <div>
              <span className="zb-eyebrow">Business brief</span>
              <h2 id="business-summary-title">Define the brief. Deploy with clarity.</h2>
            </div>
          </div>
          <p className="zb-premium-card-copy">
            Set the team, coverage and engagement model before execution starts.
          </p>
          <div className="zb-premium-stat-grid">
            <article>
              <Users aria-hidden="true" />
              <span>Workforce</span>
              <strong>Roles &amp; team size</strong>
            </article>
            <article>
              <MapPin aria-hidden="true" />
              <span>Coverage</span>
              <strong>Site, city or multi-city</strong>
            </article>
            <article>
              <Building2 aria-hidden="true" />
              <span>Model</span>
              <strong>Ongoing or project based</strong>
            </article>
          </div>
          <div className="zb-premium-card-footer">
            <span>One brief. Multiple execution needs.</span>
            <ActionLink href="/hire-workforce" variant="text">
              Start brief <ArrowUpRight aria-hidden="true" className="size-4" />
            </ActionLink>
          </div>
        </aside>
      </div>

      <section
        className="zb-company-section"
        aria-labelledby="business-needs-title"
      >
        <SectionHeading
          id="business-needs-title"
          eyebrow="Choose your starting point"
          title="What does your business need?"
          description="Explore the service closest to your requirement. A brief can bring several roles and activities together."
        />
        <div className="zb-company-grid" data-columns="2">
          {businessNeeds.map((need, index) => {
            const Icon = icons[need.id];
            return (
              <Link
                href={"/" + need.solutionSlug}
                key={need.id}
                className="zb-card-link"
              >
                <Card className="zb-card zb-business-card">
                  <div className="zb-card-top">
                    <Icon className="zb-card-icon" aria-hidden="true" />
                    <span className="zb-company-index" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="zb-card-title">{need.title}</h3>
                  <p className="zb-card-copy">{need.description}</p>
                  <ul className="zb-company-tags">
                    {need.services.map((service) => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                  <span className="zb-card-cta">
                    {need.linkLabel}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        className="zb-company-section zb-company-brief"
        aria-labelledby="business-brief-title"
      >
        <div>
          <span className="zb-eyebrow">A useful first conversation</span>
          <h2 id="business-brief-title">
            You bring the requirement. We start with the details.
          </h2>
          <p>
            A clear brief connects the right services with the way your business
            works.
          </p>
          <ActionLink href="/how-it-works" variant="text">
            See the delivery process{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </ActionLink>
        </div>
        <dl>
          {briefChecklist.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        className="zb-company-section zb-company-faq"
        aria-labelledby="business-questions-title"
      >
        <SectionHeading
          id="business-questions-title"
          eyebrow="Before you begin"
          title="A few practical questions"
          action={
            <ActionLink href="/contact" variant="text">
              Ask something else
            </ActionLink>
          }
        />
        {businessQuestions.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
      <div className="zb-company-section">
        <CTASection
          title="Tell us what you need."
          description="Share your roles, locations and timeline. Start with the main service and add the rest of the detail in your brief."
          label="Share your requirement"
        />
      </div>
    </div>
  );
}
