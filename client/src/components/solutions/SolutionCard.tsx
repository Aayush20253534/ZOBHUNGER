import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Flag,
  Headset,
  Megaphone,
  Store,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { solutionVisuals } from "@/data/solution-visuals";
import type { SolutionSummary } from "@/types/catalog.types";
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

const cardNumbers: Record<SolutionSlug, string> = {
  "workforce-solutions": "01",
  "sales-force": "02",
  "promoter-solutions": "03",
  "retail-execution": "04",
  "brand-activation": "05",
  "business-operations": "06",
  "gig-workforce": "07",
};

export function SolutionCard({ solution }: { solution: SolutionSummary }) {
  const slug = solution.slug as SolutionSlug;
  const Icon = icons[slug] ?? UsersRound;
  const visual = solutionVisuals[slug];

  return (
    <Link
      href={`/${solution.slug}`}
      className="zb-card-link zb-solution-card-link"
      aria-label={`Explore ${solution.label}`}
    >
      <Card className="zb-card zb-solution-showcase-card">
        <div className="zb-solution-card-graphic" aria-hidden="true">
          <span className="zb-solution-card-icon-wrap">
            <Icon />
          </span>
          <span className="zb-solution-card-graphic-line" />
          <span className="zb-solution-card-dot zb-solution-card-dot--one" />
          <span className="zb-solution-card-dot zb-solution-card-dot--two" />
          <span className="zb-solution-card-dot zb-solution-card-dot--three" />
          <strong>{cardNumbers[slug]}</strong>
        </div>

        <div className="zb-card-top zb-solution-card-heading-row">
          <Badge className="zb-chip" data-tone="accent">
            {solution.label}
          </Badge>
          <span className="zb-solution-card-kicker">Execution service</span>
        </div>

        <div className="zb-solution-card-copy-block">
          <h3 className="zb-card-title">{solution.title}</h3>
          <p className="zb-card-copy">{solution.description}</p>
        </div>

        <div className="zb-solution-card-flow" aria-label={`${solution.label} execution preview`}>
          {visual.stages.slice(0, 3).map((stage, index) => (
            <div className="zb-solution-card-flow-step" key={stage}>
              <span className="zb-solution-card-step-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <strong>{stage}</strong>
              {index < 2 ? <ArrowRight className="zb-solution-card-flow-arrow" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>

        <div className="zb-card-meta zb-solution-card-tags">
          {solution.services.map((service) => (
            <span className="zb-chip" key={service}>
              {service}
            </span>
          ))}
        </div>

        <span className="zb-card-cta zb-solution-card-cta">
          <span>View execution model</span>
          <span className="zb-solution-card-cta-icon" aria-hidden="true">
            <ArrowUpRight />
          </span>
        </span>
      </Card>
    </Link>
  );
}
