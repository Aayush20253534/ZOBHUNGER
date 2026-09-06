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
import type { SolutionSummary } from "@/types/catalog.types";

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
  const Icon = icons[solution.slug as keyof typeof icons] ?? UsersRound;
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
        <div className="zb-card-meta">
          {solution.services.map((service) => (
            <span className="zb-chip" key={service}>
              {service}
            </span>
          ))}
        </div>
        <span className="zb-card-cta">
          Explore solution{" "}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </Card>
    </Link>
  );
}
