import { ArrowUpRight, Layers3, MessagesSquare } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
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
        items={[{ label: "Home", href: "/" }, { label: "Solutions" }]}
      />
      <div className="zb-solution-hero zb-solutions-overview-hero">
        <PageShell
          eyebrow="Hire. Deploy. Manage. Execute. Scale."
          title="Our solutions"
          description="Everything your business needs to hire, deploy and manage teams. Find recruitment, sales, campaign and operations support in one connected service catalogue."
          actions={
            <>
              <ActionLink href="/hire-workforce">
                Share your requirement{" "}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink href="#solution-catalogue" variant="secondary">
                Explore the solutions
              </ActionLink>
            </>
          }
        />
        <aside
          className="zb-solution-brief zb-solutions-overview-brief"
          aria-labelledby="solutions-brief-heading"
        >
          <Layers3 aria-hidden="true" />
          <h2 id="solutions-brief-heading">
            Start with the work you need done.
          </h2>
          <p>
            One requirement can bring several services together. We’ll help you
            work through the roles and execution needs.
          </p>
          <dl>
            <div>
              <dt>Build a team</dt>
              <dd>Recruitment, staffing and sales roles</dd>
            </div>
            <div>
              <dt>Reach your customers</dt>
              <dd>Promoters, retail and brand activation</dd>
            </div>
            <div>
              <dt>Support the work</dt>
              <dd>Business operations and gig workforce</dd>
            </div>
          </dl>
        </aside>
      </div>
      <section
        id="solution-catalogue"
        className="zb-solution-section"
        aria-labelledby="solution-catalogue-heading"
      >
        <SectionHeading
          id="solution-catalogue-heading"
          eyebrow="The service catalogue"
          title="Seven solutions. Built to work together."
          description="Explore each solution for the roles, services and engagement options it covers."
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
