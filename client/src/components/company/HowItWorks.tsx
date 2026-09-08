import { ArrowUpRight } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { DeliveryJourney } from "@/components/company/DeliveryJourney";
import { PageShell } from "@/components/common/PageShell";
import { briefChecklist } from "@/data/company";
import "@/styles/company.css";

export function HowItWorks() {
  return (
    <div className="zb-company">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "How It Works" }]}
      />
      <PageShell
        eyebrow="How it works"
        title="From requirement to execution."
        description="A clear brief is the starting point. The delivery process connects sourcing, selection, deployment and the updates your business needs along the way."
        actions={
          <>
            <ActionLink href="/hire-workforce">
              Start with your requirement{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </ActionLink>
            <ActionLink href="#delivery-journey" variant="secondary">
              Explore the delivery journey
            </ActionLink>
          </>
        }
      />
      <DeliveryJourney />
      <section
        className="zb-company-section zb-company-brief"
        aria-labelledby="process-brief-title"
      >
        <div>
          <span className="zb-eyebrow">Before you begin</span>
          <h2 id="process-brief-title">
            Four things that help shape the plan.
          </h2>
          <p>
            The exact scope, timeline and reporting arrangements are agreed for
            each assignment.
          </p>
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
      <div className="zb-company-section">
        <CTASection
          title="What does your next assignment need?"
          description="Share the roles, locations and timeline you have in mind."
        />
      </div>
    </div>
  );
}
