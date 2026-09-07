import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import { brandStrengths } from "@/data/core-capabilities";

export function ExecutionStrengthsPreview() {
  return (
    <section
      className="zb-home-section zb-home-execution-strengths"
      aria-labelledby="home-execution-strengths-heading"
    >
      <div className="zb-home-execution-strengths-intro">
        <SectionHeading
          id="home-execution-strengths-heading"
          eyebrow="Execution strength"
          title="Built for on-ground delivery, not just hiring."
          description="From deployment and audit to activation, acquisition and onboarding, our operating model is designed around the work a brand needs completed in the market."
        />
        <ActionLink href="/brand-experience" variant="secondary">
          Explore our capabilities
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </ActionLink>
      </div>

      <ul className="zb-home-execution-strengths-list">
        {brandStrengths.map((strength) => (
          <li key={strength}>
            <CheckCircle2 aria-hidden="true" />
            <span>{strength}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
