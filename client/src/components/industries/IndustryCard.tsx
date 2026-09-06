import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { IndustrySummary } from "@/types/catalog.types";

export function IndustryCard({ industry }: { industry: IndustrySummary }) {
  return (
    <Link
      href={`/industries/${industry.slug}`}
      className="zb-card-link"
      aria-label={`Explore ${industry.title} solutions`}
    >
      <Card className="zb-card">
        <Building2 className="zb-card-icon" aria-hidden="true" />
        <h3 className="zb-card-title">{industry.title}</h3>
        <p className="zb-card-copy">
          {industry.description ??
            `Workforce and business execution solutions for ${industry.title}.`}
        </p>
        <span className="zb-card-cta">
          Explore industry{" "}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </Card>
    </Link>
  );
}
