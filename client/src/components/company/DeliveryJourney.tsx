import { ExecutionExplorer } from "@/components/common/ExecutionExplorer";
import { ExecutionStory } from "@/components/common/ExecutionStory";
import { SectionHeading } from "@/components/common/SectionHeading";
import { deliveryJourneyStories } from "@/data/execution-storytelling";

export function DeliveryJourney() {
  return (
    <section id="delivery-journey" aria-labelledby="delivery-journey-heading">
      <SectionHeading
        id="delivery-journey-heading"
        eyebrow="One connected delivery plan"
        title="From the first brief to the next action."
        description="Choose a stage to see how your requirement reaches the field and how the work comes back into review."
      />
      <ExecutionExplorer
        id="delivery-stages"
        label="Choose a delivery stage"
        items={deliveryJourneyStories.map((item, index) => ({
          id: item.id,
          label: item.label,
          content: (
            <ExecutionStory
              id={`delivery-story-${item.id}`}
              label={`Delivery stage ${String(index + 1).padStart(2, "0")} / 06`}
              story={item.story}
            />
          ),
        }))}
      />
    </section>
  );
}
