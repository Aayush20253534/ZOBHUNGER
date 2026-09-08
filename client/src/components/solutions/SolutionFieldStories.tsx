import { ArrowUpRight } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { ExecutionExplorer } from "@/components/common/ExecutionExplorer";
import { ExecutionStory } from "@/components/common/ExecutionStory";
import { SectionHeading } from "@/components/common/SectionHeading";
import { solutionFieldStories } from "@/data/execution-storytelling";
import type { SolutionSlug } from "@/types/solution-detail.types";

export function SolutionFieldStories({ slug }: { slug: SolutionSlug }) {
  const stories = solutionFieldStories[slug];

  return (
    <section
      id="solution-in-action"
      className="zb-solution-section"
      aria-labelledby="solution-in-action-heading"
    >
      <SectionHeading
        id="solution-in-action-heading"
        eyebrow="Execution in practice"
        title="See how the work happens."
        description={
          stories.length > 1
            ? "Choose an activity to follow the interaction, the team's actions and the updates your business can review."
            : "Follow an example assignment, the team's actions and the updates your business can review."
        }
      />
      <ExecutionExplorer
        id={`solution-stories-${slug}`}
        label="Choose a service activity"
        items={stories.map((item) => ({
          id: item.id,
          label: item.label,
          content: (
            <ExecutionStory
              id={`solution-story-${item.id}`}
              label={item.label}
              story={item.story}
            />
          ),
        }))}
      />
      <div className="zb-execution-story-footer">
        <p>Typical execution examples. Scope and reporting are agreed for each assignment.</p>
        <ActionLink href="/how-it-works#delivery-journey" variant="text">
          Follow the full delivery journey <ArrowUpRight aria-hidden="true" />
        </ActionLink>
      </div>
    </section>
  );
}
