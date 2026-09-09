import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Layers3,
  MapPinned,
  MessagesSquare,
  Workflow,
} from "lucide-react";
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

const executionLanes = [
  {
    icon: BriefcaseBusiness,
    label: "Build the team",
    description:
      "Recruitment, staffing and flexible workforce for defined roles and timelines.",
    services: ["Workforce", "Gig Workforce"],
    flow: ["Brief", "Match", "Deploy"],
  },
  {
    icon: MapPinned,
    label: "Execute in market",
    description:
      "Customer-facing and retail activity across territories, outlets, events and campaigns.",
    services: ["Sales Force", "Promoters", "Retail", "Activation"],
    flow: ["Plan", "Activate", "Report"],
  },
  {
    icon: Workflow,
    label: "Support operations",
    description:
      "Coordinated capacity for verification, customer support, data and back-office workflows.",
    services: ["Business Operations", "Verification"],
    flow: ["Scope", "Onboard", "Coordinate"],
  },
] as const;

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
          description="Everything your business needs to hire, deploy and manage teams. Find recruitment, verification, sales, campaign and operations support in one connected service catalogue."
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
        className="zb-solution-section zb-solution-execution-map"
        aria-labelledby="solution-execution-map-heading"
      >
        <SectionHeading
          id="solution-execution-map-heading"
          eyebrow="From brief to execution"
          title="See how the work moves before you choose a service."
          description="ZOBHUNGER services are organised around three practical outcomes: building teams, executing in market and supporting ongoing business operations."
        />
        <div className="zb-solution-execution-lanes">
          {executionLanes.map((lane) => {
            const LaneIcon = lane.icon;
            return (
              <article key={lane.label} className="zb-solution-execution-lane">
                <div className="zb-solution-execution-lane-heading">
                  <span aria-hidden="true">
                    <LaneIcon />
                  </span>
                  <div>
                    <small>Execution lane</small>
                    <h3>{lane.label}</h3>
                  </div>
                </div>
                <p>{lane.description}</p>
                <div
                  className="zb-solution-execution-lane-flow"
                  aria-hidden="true"
                >
                  {lane.flow.map((step, index) => (
                    <span key={step}>
                      {step}
                      {index < lane.flow.length - 1 && <ArrowRight />}
                    </span>
                  ))}
                </div>
                <div className="zb-solution-execution-lane-services">
                  {lane.services.map((service) => (
                    <span key={service}>{service}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section
        id="solution-catalogue"
        className="zb-solution-section"
        aria-labelledby="solution-catalogue-heading"
      >
        <SectionHeading
          id="solution-catalogue-heading"
          eyebrow="The service catalogue"
          title="Eight services. One connected execution system."
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
