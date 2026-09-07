import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CaseStudy } from "@/data/case-studies";

export function CaseStudyCard({ study, index }: { study: CaseStudy; index: number }) {
  return (
    <article className="zb-case-card">
      <div className="zb-case-card-topline">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span>{study.category}</span>
      </div>
      <div className="zb-case-brand">{study.brand}</div>
      <h3>{study.title}</h3>
      <p>{study.summary}</p>
      <ul aria-label={`${study.brand} capabilities`}>
        {study.capabilities.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
      </ul>
      <Link href={`/case-studies/${study.slug}`} className="zb-case-card-link">
        View project <ArrowUpRight aria-hidden="true" />
      </Link>
    </article>
  );
}
