import Link from "next/link";
import {
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

export function SolutionCard({ solution }: { solution: SolutionSummary }) {
  const slug = solution.slug as SolutionSlug;
  const Icon = icons[slug] ?? UsersRound;
  const visual = solutionVisuals[slug];
  return (
    <Link
      href={`/${solution.slug}`}
      className="zb-card-link"
      aria-label={`Explore ${solution.label}`}
    >
      <Card className="zb-card">
        <div className="zb-card-top">
          <Icon className="zb-card-icon" aria-hidden="true" />
          <Badge className="zb-chip" data-tone="accent">
            {solution.label}
          </Badge>
        </div>
        <h3 className="zb-card-title">{solution.title}</h3>
        <p className="zb-card-copy">{solution.description}</p>
        <div className="zb-solution-card-flow" aria-hidden="true">
          {visual.stages.slice(0, 3).map((stage, index) => (
            <span key={stage}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              {stage}
            </span>
          ))}
        </div>
        <div className="zb-card-meta">
          {solution.services.map((service) => (
            <span className="zb-chip" key={service}>
              {service}
            </span>
          ))}
        </div>
        <span className="zb-card-cta">
          View execution model{" "}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </Card>
    </Link>
  );
}
