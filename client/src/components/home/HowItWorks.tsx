import { ActionLink } from "@/components/common/ActionLink";
import { ProcessFlow } from "@/components/common/ProcessFlow";
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
      <ProcessFlow
        steps={home.process.steps}
        label="Five steps from brief to delivery"
      />
    </section>
  );
}
