import {
  CalendarClock,
  Flag,
  Headset,
  Megaphone,
  Store,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { solutionVisuals } from "@/data/solution-visuals";
import type { SolutionSlug } from "@/types/solution-detail.types";

const icons = {
  "workforce-solutions": UsersRound,
  "sales-force": TrendingUp,
  "promoter-solutions": Megaphone,
  "retail-execution": Store,
  "brand-activation": Flag,
  "business-operations": Headset,
  "gig-workforce": CalendarClock,
};

interface SolutionExecutionVisualProps {
  slug: SolutionSlug;
  label: string;
  facts: readonly { label: string; value: string }[];
  bestFor: string;
}

export function SolutionExecutionVisual({
  slug,
  label,
  facts,
  bestFor,
}: SolutionExecutionVisualProps) {
  const profile = solutionVisuals[slug];
  const Icon = icons[slug];

  return (
    <aside
      className="zb-solution-execution-visual"
      aria-labelledby={`solution-visual-${slug}`}
    >
      <div className="zb-solution-visual-heading">
        <span className="zb-solution-visual-icon" aria-hidden="true">
          <Icon />
        </span>
        <div>
          <span className="zb-eyebrow">{profile.eyebrow}</span>
          <h2 id={`solution-visual-${slug}`}>{profile.title}</h2>
        </div>
      </div>

      <p className="zb-solution-visual-description">{profile.description}</p>

      <ol className="zb-solution-visual-flow" aria-label={`${label} execution flow`}>
        {profile.stages.map((stage, index) => (
          <li key={stage}>
            <span className="zb-solution-visual-step-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <strong>{stage}</strong>
          </li>
        ))}
      </ol>

      <div className="zb-solution-visual-best-for">
        <small>Best for</small>
        <p>{bestFor}</p>
      </div>

      <div className="zb-solution-visual-modes" aria-label={`${label} work modes`}>
        {profile.workModes.map((mode) => (
          <span key={mode}>{mode}</span>
        ))}
      </div>

      <dl className="zb-solution-visual-facts">
        {facts.slice(0, 3).map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
