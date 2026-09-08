import {
  ChartNoAxesCombined,
  ClipboardCheck,
  Route,
  ScanSearch,
  UsersRound,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";

const steps = [
  {
    number: "01",
    title: "Understand the requirement",
    description: "Roles, markets, timeline and the execution outcome are defined first.",
    icon: ClipboardCheck,
  },
  {
    number: "02",
    title: "Build the right team",
    description: "Source and screen people against the skills, availability and location needed.",
    icon: ScanSearch,
  },
  {
    number: "03",
    title: "Deploy in market",
    description: "Coordinate onboarding, briefing and deployment around the agreed operating plan.",
    icon: UsersRound,
  },
  {
    number: "04",
    title: "Execute the work",
    description: "Keep teams aligned to the activity, territory, outlet or project they are supporting.",
    icon: Route,
  },
  {
    number: "05",
    title: "Review & report",
    description: "Bring execution updates back into a clear reporting and next-step rhythm.",
    icon: ChartNoAxesCombined,
  },
] as const;

export function HomeExecutionModel() {
  return (
    <section
      className="zb-home-section zb-home-execution-model"
      aria-labelledby="home-execution-model-title"
    >
      <div className="zb-home-execution-model-heading">
        <SectionHeading
          id="home-execution-model-title"
          eyebrow="How we execute"
          title="From requirement to work on the ground."
          description="ZOBHUNGER connects hiring with deployment and execution, so the team is built around what the business actually needs completed."
          action={
            <ActionLink href="/how-it-works" variant="text">
              See the full process
            </ActionLink>
          }
        />
      </div>

      <ol className="zb-home-execution-flow">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.number}>
              <div className="zb-home-execution-step-top">
                <span>{step.number}</span>
                <Icon aria-hidden="true" />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < steps.length - 1 ? (
                <span className="zb-home-execution-connector" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="zb-home-execution-summary" aria-label="Execution model summary">
        <span>Requirement</span>
        <i aria-hidden="true" />
        <span>People</span>
        <i aria-hidden="true" />
        <span>Deployment</span>
        <i aria-hidden="true" />
        <span>Execution</span>
        <i aria-hidden="true" />
        <span>Reporting</span>
      </div>
    </section>
  );
}
