import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import type { BriefCaseStudy as BriefCaseStudyData } from "@/data/service-industry-case-studies";
import "@/styles/case-study-brief.css";

export function BriefCaseStudy({
  study,
  id,
}: {
  study: BriefCaseStudyData;
  id: string;
}) {
  const blocks = [
    { label: "Challenges", items: study.challenges },
    { label: "Solution", items: study.solution },
    { label: "Results", items: study.results },
  ] as const;

  return (
    <section className="zb-brief-case-study" id={id} aria-labelledby={`${id}-title`}>
      <div className="zb-brief-case-study-head">
        <div>
          <span className="zb-eyebrow">Brief case study</span>
          <small className="zb-brief-case-study-about-label">About the project</small>
          <h2 id={`${id}-title`}>{study.title}</h2>
          <p>{study.about}</p>
        </div>
        <dl>
          <div>
            <dt>Industry</dt>
            <dd>{study.industry}</dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>{study.service}</dd>
          </div>
        </dl>
      </div>

      <div className="zb-brief-case-study-flow">
        {blocks.map((block, blockIndex) => (
          <article key={block.label}>
            <div className="zb-brief-case-study-label">
              <span>{String(blockIndex + 1).padStart(2, "0")}</span>
              <h3>{block.label}</h3>
            </div>
            <ul>
              {block.items.map((item) => (
                <li key={item}>
                  <CheckCircle2 aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="zb-brief-case-study-footer">
        <p>
          Representative project format. Brand-specific claims and quantitative outcomes are only published when approved project evidence is available.
        </p>
        <ActionLink href="/case-studies" variant="text">
          Explore all case studies <ArrowUpRight className="size-4" aria-hidden="true" />
        </ActionLink>
      </div>
    </section>
  );
}
