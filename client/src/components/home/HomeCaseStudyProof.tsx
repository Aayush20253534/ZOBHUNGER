import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, QrCode, ShoppingBag } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import { caseStudies } from "@/data/case-studies";

const caseStudyIcons = {
  "digital-merchant-onboarding-qr-deployment": QrCode,
  "marketplace-seller-acquisition": ShoppingBag,
} as const;

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
        description="Representative sector stories show the challenge, execution model and outcome behind each engagement type."
        action={
          <ActionLink href="/case-studies" variant="text">
            Explore case studies
          </ActionLink>
        }
      />

      <div className="zb-home-project-grid">
        {caseStudies.slice(0, 2).map((study) => {
          const flow = study.solution.slice(0, 4);
          const ProjectIcon =
            caseStudyIcons[study.slug as keyof typeof caseStudyIcons] ?? BriefcaseBusiness;
          return (
            <Link
              href={`/case-studies/${study.slug}`}
              className="zb-home-project-card"
              key={study.slug}
            >
              <div className="zb-home-project-brand">
                <span aria-hidden="true">
                  <ProjectIcon />
                </span>
                <div>
                  <small>{study.category}</small>
                  <strong>{study.industry}</strong>
                </div>
              </div>

              <div className="zb-home-project-copy">
                <span className="zb-eyebrow">{study.clientType}</span>
                <h3>{study.title}</h3>
                <p>{study.about}</p>
              </div>

              <ol className="zb-home-project-flow" aria-label={`${study.title} solution preview`}>
                {flow.map((step: string, index: number) => (
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
