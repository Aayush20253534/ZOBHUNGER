/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { brandLogoUrl } from "@/data/brand-logos";
import type { CaseStudy } from "@/data/case-studies";

export function ExperienceProjectCard({ study }: { study: CaseStudy }) {
  const logoUrl = brandLogoUrl(study.brand);
  const flow = study.execution.slice(0, 4);

  return (
    <article className="zb-experience-project-card">
      <div className="zb-experience-project-brandline">
        <span className="zb-experience-project-logo" aria-hidden="true">
          {logoUrl ? (
            <img src={logoUrl} alt="" loading="lazy" width="32" height="32" />
          ) : (
            <span>{study.brand.slice(0, 1)}</span>
          )}
        </span>
        <div>
          <span>{study.department}</span>
          <strong>{study.brand}</strong>
        </div>
      </div>

      <div className="zb-experience-project-copy">
        <span className="zb-eyebrow">Project story</span>
        <h3>{study.title}</h3>
        <p>{study.summary}</p>
      </div>

      <ol className="zb-experience-project-flow" aria-label={`${study.brand} execution flow`}>
        {flow.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <CheckCircle2 aria-hidden="true" />
              <p>{step}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link href={`/case-studies/${study.slug}`} className="zb-experience-project-link">
        View full case study <ArrowUpRight aria-hidden="true" />
      </Link>
    </article>
  );
}
