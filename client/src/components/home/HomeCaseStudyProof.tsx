import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { SectionHeading } from "@/components/common/SectionHeading";
import { caseStudies } from "@/data/case-studies";
import { getCaseStudyVisualStory } from "@/data/case-study-visuals";
import { executionVisuals } from "@/data/execution-visuals";
import "@/styles/home-case-stories.css";

export function HomeCaseStudyProof() {
  return (
    <section className="zb-home-section zb-home-project-proof" aria-labelledby="home-project-proof-title">
      <SectionHeading
        id="home-project-proof-title"
        eyebrow="Execution stories"
        title="See how execution takes shape in the field."
        description="Explore representative project models from the first field interaction to the client handover."
        action={<ActionLink href="/case-studies" variant="text">Explore case studies</ActionLink>}
      />
      <div className="zb-home-project-grid">
        {caseStudies.slice(0, 2).map((study) => {
          const story = getCaseStudyVisualStory(study.slug);
          return (
            <Link href={`/case-studies/${study.slug}`} className="zb-home-project-card zb-home-case-story" key={study.slug}>
              {story && <ExecutionImage visual={executionVisuals[story.cover]} sizes="(min-width: 1280px) 540px, (min-width: 760px) 44vw, calc(100vw - 88px)" />}
              <div className="zb-home-project-copy">
                <span className="zb-eyebrow">{study.category}</span>
                <h3>{study.title}</h3>
                <p>{story?.introduction ?? study.about}</p>
              </div>
              {story && (
                <ol className="zb-home-case-stages" aria-label={`${study.title} execution preview`}>
                  {story.stages.map((step, index) => (
                    <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step.title}</strong></li>
                  ))}
                </ol>
              )}
              <span className="zb-home-project-link">Follow the execution<ArrowUpRight aria-hidden="true" /></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
