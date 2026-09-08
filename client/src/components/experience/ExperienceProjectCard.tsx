import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ChevronDown } from "lucide-react";
import type { CaseStudy } from "@/data/case-studies";

export function ExperienceProjectCard({ study }: { study: CaseStudy }) {
  const flow = study.solution.slice(0, 4);

  return (
    <article className="zb-experience-project-card">
      <div className="zb-experience-project-brandline">
        <span className="zb-experience-project-logo" aria-hidden="true">
          <span>{study.industry.slice(0, 1)}</span>
        </span>
        <div>
          <span>{study.category}</span>
          <strong>{study.industry}</strong>
        </div>
      </div>

      <div className="zb-experience-project-copy">
        <span className="zb-eyebrow">Case study</span>
        <h3>{study.title}</h3>
        <p>{study.about}</p>
      </div>

      <details className="zb-experience-project-details">
        <summary>
          <span>View execution steps</span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <ol className="zb-experience-project-flow" aria-label={`${study.title} solution flow`}>
          {flow.map((step: string, index: number) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <CheckCircle2 aria-hidden="true" />
                <p>{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </details>

      <Link href={`/case-studies/${study.slug}`} className="zb-experience-project-link">
        View full case study <ArrowUpRight aria-hidden="true" />
      </Link>
    </article>
  );
}
