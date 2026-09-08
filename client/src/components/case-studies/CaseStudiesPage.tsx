import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { CaseStudyCard } from "@/components/case-studies/CaseStudyCard";
import { caseStudies } from "@/data/case-studies";
import { executionVisuals } from "@/data/execution-visuals";
import "@/styles/case-studies.css";
import "@/styles/case-study-storytelling.css";

export function CaseStudiesPage() {
  return (
    <div className="zb-case-page zb-case-page-compact">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Case studies" }]} />

      <section className="zb-case-hero zb-case-hero-compact">
        <PageShell
          eyebrow="Case studies"
          title="Execution stories, organised around the work."
          description="Brief, sector-led examples of how ZOBHUNGER can structure field teams, onboarding, audits, activations, surveys and managed workforce programmes."
          actions={<ActionLink href="#case-study-projects">Explore case studies <ArrowRight className="size-4" aria-hidden="true" /></ActionLink>}
        />
        <Link href="/case-studies/digital-merchant-onboarding-qr-deployment" className="zb-case-feature">
          <ExecutionImage visual={executionVisuals["qr-deployment"]} sizes="(min-width: 1280px) 500px, (min-width: 960px) 40vw, calc(100vw - 48px)" priority />
          <div>
            <span className="zb-eyebrow">Inside a merchant visit</span>
            <h2>From a counter conversation to a checked QR handover.</h2>
            <span className="zb-case-feature-link">Follow the field team<ArrowRight aria-hidden="true" /></span>
          </div>
        </Link>
      </section>

      <section id="case-study-projects" className="zb-case-section" aria-labelledby="case-projects-title">
        <div className="zb-case-section-heading zb-case-section-heading-compact">
          <div>
            <span className="zb-eyebrow">Representative project briefs</span>
            <h2 id="case-projects-title">See the work, the handover and the next step.</h2>
          </div>
          <p>Explore eight representative project models through illustrated field scenes, activity sequences and the updates a client can review.</p>
        </div>

        <div className="zb-case-grid zb-case-grid-compact">
          {caseStudies.map((study, index) => (
            <CaseStudyCard key={study.slug} study={study} index={index} />
          ))}
        </div>
      </section>

      <div className="zb-case-section">
        <CTASection
          title="Have an execution brief of your own?"
          description="Share the requirement, locations and outcome you need. Our team can shape the workforce and delivery model around it."
          href="/hire-workforce"
          label="Discuss your requirement"
        />
      </div>
    </div>
  );
}
