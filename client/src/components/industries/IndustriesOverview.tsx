import { ArrowUpRight, ClipboardList, MessagesSquare } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { IntroPanel } from "@/components/common/IntroPanel";
import { PageShell } from "@/components/common/PageShell";
import { PublicVisualStory } from "@/components/common/PublicVisualStory";
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
        <IntroPanel
          id="industry-overview-context-heading"
          icon={<ClipboardList />}
          title="Your industry is the starting point."
          description="The right team depends on the work, where it happens and how long you need support."
          items={[
            {
              label: "The work",
              value: "Roles, activities and responsibilities",
            },
            {
              label: "The coverage",
              value: "Locations, outlets or remote teams",
            },
            {
              label: "The engagement",
              value: "People, dates and working schedules",
            },
          ]}
        />
      </div>

      <PublicVisualStory
        eyebrow="Across markets"
        title="Different sectors. Different execution realities."
        description="The service changes with the environment: a retail audit, seller onboarding programme and delivery operation each need a different field rhythm."
        items={[
          { visual: "audit", title: "Retail & consumer markets", description: "Outlet visits, availability checks and field evidence help teams understand what is happening where customers buy.", href: "/industries/retail", linkLabel: "Explore retail" },
          { visual: "seller-onboarding", title: "E-commerce & digital commerce", description: "Onboarding support helps merchants move from interest to registration and listing readiness.", href: "/industries/e-commerce", linkLabel: "Explore e-commerce" },
          { visual: "last-mile-delivery", title: "Logistics & mobility", description: "Operational teams support handovers, local coverage and the coordination needed for distributed delivery work.", href: "/industries/logistics", linkLabel: "Explore logistics" },
        ]}
      />

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
