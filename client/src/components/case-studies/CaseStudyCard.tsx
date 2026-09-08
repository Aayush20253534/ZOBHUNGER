import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import type { CaseStudy } from "@/data/case-studies";
import { getCaseStudyVisualStory } from "@/data/case-study-visuals";
import { executionVisuals } from "@/data/execution-visuals";
import "@/styles/case-study-storytelling.css";

export function CaseStudyCard({ study, index }: { study: CaseStudy; index: number }) {
  const story = getCaseStudyVisualStory(study.slug);
  return (
    <article className="zb-case-card zb-case-card-compact zb-case-card-visual">
      {story && (
        <div className="zb-case-card-cover">
          <ExecutionImage
            visual={executionVisuals[story.cover]}
            sizes="(min-width: 1280px) 380px, (min-width: 1080px) 30vw, (min-width: 760px) 44vw, calc(100vw - 80px)"
          />
        </div>
      )}
      <div className="zb-case-card-topline">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span>{study.category}</span>
      </div>

      <h3><Link href={`/case-studies/${study.slug}`}>{study.title}</Link></h3>
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
        <span>Intended outcome</span>
        <p>{study.results[0]}</p>
      </div>

      <Link href={`/case-studies/${study.slug}`} className="zb-case-card-link">
        Follow the execution <ArrowUpRight aria-hidden="true" />
      </Link>
    </article>
  );
}
