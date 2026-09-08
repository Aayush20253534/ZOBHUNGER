import { ExecutionImage } from "@/components/common/ExecutionImage";
import { solutionIcons, solutionStageIcons } from "@/components/solutions/solution-icons";
import { executionVisuals } from "@/data/execution-visuals";
import { solutionCoverVisuals } from "@/data/solution-cover-visuals";
import { solutionVisuals } from "@/data/solution-visuals";
import type { SolutionSlug } from "@/types/solution-detail.types";

interface SolutionExecutionVisualProps {
  slug: SolutionSlug;
  label: string;
}

export function SolutionExecutionVisual({ slug, label }: SolutionExecutionVisualProps) {
  const profile = solutionVisuals[slug];
  const Icon = solutionIcons[slug];
  const stageIcons = solutionStageIcons[slug];
  const visual = executionVisuals[solutionCoverVisuals[slug]];

  return (
    <aside className="zb-service-hero-card" aria-labelledby={`solution-visual-${slug}`}>
      <div className="zb-service-hero-scene">
        <ExecutionImage
          visual={visual}
          sizes="(min-width: 960px) 416px, (min-width: 600px) 480px, calc(100vw - 32px)"
          priority
        />
        <span className="zb-service-hero-scene-label">
          <Icon aria-hidden="true" /> {label} in action
        </span>
      </div>

      <div className="zb-service-hero-body">
        <h2 id={`solution-visual-${slug}`}>{profile.title}</h2>
        <ol className="zb-service-hero-flow" aria-label={`${label} execution flow`}>
          {profile.stages.map((stage, index) => {
            const StageIcon = stageIcons[index];
            return (
              <li key={stage}>
                <span className="zb-service-stage-icon" aria-hidden="true">
                  <StageIcon />
                  <small>{index + 1}</small>
                </span>
                <strong>{stage}</strong>
              </li>
            );
          })}
        </ol>
        <ul className="zb-service-hero-modes" aria-label={`${label} work modes`}>
          {profile.workModes.map((mode) => <li key={mode}>{mode}</li>)}
        </ul>
      </div>
    </aside>
  );
}
