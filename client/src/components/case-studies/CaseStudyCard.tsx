import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import type { CaseStudy } from "@/data/case-studies";

export function CaseStudyCard({ study, index }: { study: CaseStudy; index: number }) {
  return (
    <article className="zb-case-card zb-case-card-compact">
      <div className="zb-case-card-topline">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span>{study.category}</span>
      </div>

      <h3>{study.title}</h3>
      <p>{study.about}</p>

      <div className="zb-case-card-meta">
        <span>{study.industry}</span>
        <span>{study.clientType}</span>
      </div>

      <ul className="zb-case-card-services" aria-label={`${study.title} services`}>
        {study.services.slice(0, 4).map((item) => (
          <li key={item}><Check aria-hidden="true" />{item}</li>
        ))}
      </ul>

      <div className="zb-case-card-outcome">
        <span>Outcome glimpse</span>
        <p>{study.results[0]}</p>
      </div>

      <Link href={`/case-studies/${study.slug}`} className="zb-case-card-link">
        View brief case study <ArrowUpRight aria-hidden="true" />
      </Link>
    </article>
  );
}
