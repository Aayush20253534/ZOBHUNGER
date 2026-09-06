import { ArrowUpRight, ClipboardList, MessagesSquare } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { IndustryCard } from "@/components/industries/IndustryCard";
import { Card } from "@/components/ui/card";
import { industries } from "@/data/industries";
import { industriesOverview, industryDetails } from "@/data/industry-details";
import "@/styles/industries.css";

export function IndustriesOverview() {
  return (
    <div className="zb-industries">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Industries" }]}
      />
      <div className="zb-industry-hero">
        <PageShell
          eyebrow="Industries we serve"
          title={industriesOverview.heading}
          description={industriesOverview.description}
          actions={
            <>
              <ActionLink href="/hire-workforce">
                Share your requirement{" "}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink href="#industry-catalogue" variant="secondary">
                Explore industries
              </ActionLink>
            </>
          }
        />
        <aside
          className="zb-industry-context"
          aria-labelledby="industry-overview-context-heading"
        >
          <ClipboardList aria-hidden="true" />
          <h2 id="industry-overview-context-heading">
            Your industry is the starting point.
          </h2>
          <p>
            The right team depends on the work, where it happens and how long
            you need support.
          </p>
          <dl>
            <div>
              <dt>The work</dt>
              <dd>Roles, activities and responsibilities</dd>
            </div>
            <div>
              <dt>The coverage</dt>
              <dd>Locations, outlets or remote teams</dd>
            </div>
            <div>
              <dt>The engagement</dt>
              <dd>People, dates and working schedules</dd>
            </div>
          </dl>
        </aside>
      </div>
      <section
        id="industry-catalogue"
        className="zb-industry-section"
        aria-labelledby="industry-catalogue-heading"
      >
        <SectionHeading
          id="industry-catalogue-heading"
          eyebrow="Find your sector"
          title="Explore the support your industry needs."
          description="See relevant roles, service combinations and the details that help shape a useful requirement."
        />
        <div className="zb-industries-catalog">
          {industries.map((industry) => (
            <IndustryCard
              key={industry.slug}
              industry={{
                ...industry,
                description: industryDetails[industry.slug].summary,
              }}
            />
          ))}
          <Card className="zb-card zb-industry-catalog-help">
            <MessagesSquare className="zb-card-icon" aria-hidden="true" />
            <h3 className="zb-card-title">Working across sectors?</h3>
            <p className="zb-card-copy">
              Tell us the work you need done. We’ll help identify the workforce
              and execution services that fit your requirement.
            </p>
            <ActionLink href="/contact" variant="text">
              Talk to our team
            </ActionLink>
          </Card>
        </div>
      </section>
      <div className="zb-industry-section">
        <CTASection
          title="Bring your industry requirement to us."
          description="Share the roles, locations and work you want to get done. We’ll help you plan the right service combination."
          href="/hire-workforce"
          label="Share your requirement"
        />
      </div>
    </div>
  );
}
