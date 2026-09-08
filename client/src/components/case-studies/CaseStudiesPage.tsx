import { ArrowRight, BriefcaseBusiness, CheckCircle2 } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { CaseStudyCard } from "@/components/case-studies/CaseStudyCard";
import { caseStudies } from "@/data/case-studies";
import "@/styles/case-studies.css";

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
        <aside className="zb-case-hero-panel zb-case-hero-panel-compact">
          <BriefcaseBusiness aria-hidden="true" />
          <span className="zb-eyebrow">Client-style format</span>
          <h2>About. Challenge. Solution. Result.</h2>
          <p>Each story stays compact and practical, so visitors can understand the operating model without reading a miniature annual report.</p>
          <div className="zb-case-hero-points">
            <span><CheckCircle2 aria-hidden="true" /> 8 core project families</span>
            <span><CheckCircle2 aria-hidden="true" /> Service-led execution detail</span>
          </div>
        </aside>
      </section>

      <section id="case-study-projects" className="zb-case-section" aria-labelledby="case-projects-title">
        <div className="zb-case-section-heading zb-case-section-heading-compact">
          <div>
            <span className="zb-eyebrow">Representative project briefs</span>
            <h2 id="case-projects-title">One strong case study for every major execution family.</h2>
          </div>
          <p>These are presented by project type rather than as unverified brand claims. Approved brand-specific results can be added later when the client supplies publishable proof.</p>
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
