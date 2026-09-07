/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { brandLogoUrl } from "@/data/brand-logos";
import type { CaseStudy } from "@/data/case-studies";

export function CaseStudyCard({ study, index }: { study: CaseStudy; index: number }) {
  const logoUrl = brandLogoUrl(study.brand);
  const executionPreview = study.execution.slice(0, 3);

  return (
    <article className="zb-case-card">
      <div className="zb-case-card-topline">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span>{study.category}</span>
      </div>

      <div className="zb-case-card-brandrow">
        <span className="zb-case-card-brandmark" aria-hidden="true">
          {logoUrl ? (
            <img src={logoUrl} alt="" loading="lazy" width="34" height="34" />
          ) : (
            <span>{study.brand.slice(0, 1)}</span>
          )}
        </span>
        <div>
          <span>Project experience</span>
          <strong>{study.brand}</strong>
        </div>
      </div>

      <h3>{study.title}</h3>
      <p>{study.summary}</p>

      <div className="zb-case-card-flow" aria-label={`${study.brand} execution preview`}>
        {executionPreview.map((item, stepIndex) => (
          <div key={item}>
            <span>{String(stepIndex + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>

      <ul aria-label={`${study.brand} capabilities`}>
        {study.capabilities.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
      </ul>
      <Link href={`/case-studies/${study.slug}`} className="zb-case-card-link">
        View project <ArrowUpRight aria-hidden="true" />
      </Link>
    </article>
  );
}
