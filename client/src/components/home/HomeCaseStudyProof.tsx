/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import { brandLogoUrl } from "@/data/brand-logos";
import { caseStudies } from "@/data/case-studies";

export function HomeCaseStudyProof() {
  return (
    <section
      className="zb-home-section zb-home-project-proof"
      aria-labelledby="home-project-proof-title"
    >
      <SectionHeading
        id="home-project-proof-title"
        eyebrow="Project proof"
        title="See how execution takes shape in the field."
        description="Selected project stories show the objective, operating flow and on-ground work behind the engagement."
        action={
          <ActionLink href="/case-studies" variant="text">
            Explore case studies
          </ActionLink>
        }
      />

      <div className="zb-home-project-grid">
        {caseStudies.slice(0, 2).map((study) => {
          const logo = brandLogoUrl(study.brand);
          return (
            <Link
              href={`/case-studies/${study.slug}`}
              className="zb-home-project-card"
              key={study.slug}
            >
              <div className="zb-home-project-brand">
                <span aria-hidden="true">
                  {logo ? (
                    <img src={logo} alt="" width="34" height="34" loading="lazy" />
                  ) : (
                    study.brand.slice(0, 1)
                  )}
                </span>
                <div>
                  <small>{study.department}</small>
                  <strong>{study.brand}</strong>
                </div>
              </div>

              <div className="zb-home-project-copy">
                <span className="zb-eyebrow">{study.category}</span>
                <h3>{study.title}</h3>
                <p>{study.summary}</p>
              </div>

              <ol className="zb-home-project-flow" aria-label={`${study.brand} execution preview`}>
                {study.execution.slice(0, 4).map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <CheckCircle2 aria-hidden="true" />
                    <p>{step}</p>
                  </li>
                ))}
              </ol>

              <span className="zb-home-project-link">
                View case study <ArrowUpRight aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
