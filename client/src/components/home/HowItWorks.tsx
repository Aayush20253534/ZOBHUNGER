import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import { home } from "@/data/home";

export function HowItWorks() {
  return (
    <section
      id="home-process"
      className="zb-home-section"
      aria-labelledby="home-process-heading"
    >
      <SectionHeading
        id="home-process-heading"
        eyebrow={home.process.eyebrow}
        title={home.process.title}
        description={home.process.description}
        action={
          <ActionLink href="/how-it-works" variant="text">
            See the full process
          </ActionLink>
        }
      />
      <ol className="zb-home-process">
        {home.process.steps.map((step, index) => (
          <li key={step.title}>
            <span className="zb-home-step-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
