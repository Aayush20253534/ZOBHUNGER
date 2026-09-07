import { ArrowUpRight, CheckCircle2, Layers3, MessagesSquare } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { IntroPanel } from "@/components/common/IntroPanel";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { SolutionCard } from "@/components/solutions/SolutionCard";
import { Card } from "@/components/ui/card";
import { solutions } from "@/data/solutions";
import "@/styles/solutions.css";

export function SolutionsOverview() {
  return (
    <div className="zb-solutions">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Our Services" }]}
      />
      <div className="zb-solution-hero zb-solutions-overview-hero">
        <PageShell
          eyebrow="Hire. Deploy. Manage. Execute. Scale."
          title="Our services"
          description="Everything your business needs to hire, deploy and manage teams. Find recruitment, sales, campaign and operations support in one connected service catalogue."
          actions={
            <>
              <ActionLink href="/hire-workforce">
                Share your requirement{" "}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink href="#solution-catalogue" variant="secondary">
                Explore the services
              </ActionLink>
            </>
          }
        >
          <div className="zb-solutions-hero-proof" aria-label="How ZOBHUNGER combines services">
            <div>
              <CheckCircle2 aria-hidden="true" />
              <span><strong>One brief</strong> across roles and locations</span>
            </div>
            <div>
              <CheckCircle2 aria-hidden="true" />
              <span><strong>Flexible execution</strong> from hiring to field operations</span>
            </div>
          </div>
        </PageShell>
        <IntroPanel
          id="solutions-brief-heading"
          icon={<Layers3 />}
          title="Start with the work you need done."
          description="One requirement can bring several services together. Connect the roles with the execution your business needs."
          items={[
            {
              label: "Build a team",
              value: "Recruitment, staffing and sales roles",
            },
            {
              label: "Reach your customers",
              value: "Promoters, retail and brand activation",
            },
            {
              label: "Support the work",
              value: "Business operations and gig workforce",
            },
          ]}
        />
      </div>
      <section
        id="solution-catalogue"
        className="zb-solution-section"
        aria-labelledby="solution-catalogue-heading"
      >
        <SectionHeading
          id="solution-catalogue-heading"
          eyebrow="The service catalogue"
          title="Seven services. Built to work together."
          description="Explore each service for the roles, execution support and engagement options it covers."
        />
        <div className="zb-solutions-catalog">
          {solutions.map((solution) => (
            <SolutionCard key={solution.slug} solution={solution} />
          ))}
          <Card className="zb-card zb-solutions-help">
            <MessagesSquare className="zb-card-icon" aria-hidden="true" />
            <h3 className="zb-card-title">
              Does your requirement span more than one service?
            </h3>
            <p className="zb-card-copy">
              A product launch may need promoters and activation support. A new
              market may need hiring and field sales. Tell us the outcome you
              need, and we’ll help you connect the requirements.
            </p>
            <ActionLink href="/contact" variant="text">
              Talk through your requirement
            </ActionLink>
          </Card>
        </div>
      </section>
      <div className="zb-solution-section">
        <CTASection
          title="Tell us what your business needs next."
          description="Share your roles, locations, duration and the work you want to get done. We’ll help you identify the right solution."
          href="/hire-workforce"
          label="Share your requirement"
        />
      </div>
    </div>
  );
}
