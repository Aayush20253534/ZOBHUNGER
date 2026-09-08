import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { executionVisuals } from "@/data/execution-visuals";
import { solutionCoverVisuals } from "@/data/solution-cover-visuals";
import { solutionVisuals } from "@/data/solution-visuals";
import type { SolutionSummary } from "@/types/catalog.types";
import type { SolutionSlug } from "@/types/solution-detail.types";
import "@/styles/solution-covers.css";

export function SolutionCard({ solution }: { solution: SolutionSummary }) {
  const slug = solution.slug as SolutionSlug;
  const visual = solutionVisuals[slug];
  const cover = executionVisuals[solutionCoverVisuals[slug]];

  return (
    <Link
      href={`/${solution.slug}`}
      className="zb-card-link zb-solution-card-link"
      aria-label={`Explore ${solution.label}`}
    >
      <Card className="zb-card zb-solution-showcase-card">
        <ExecutionImage
          visual={cover}
          className="zb-solution-card-cover"
          sizes="(min-width: 1280px) 380px, (min-width: 1100px) 30vw, (min-width: 640px) 45vw, calc(100vw - 80px)"
        />

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
