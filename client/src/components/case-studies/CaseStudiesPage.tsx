import { ArrowRight, BriefcaseBusiness, Layers3 } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { CaseStudyCard } from "@/components/case-studies/CaseStudyCard";
import { caseStudies, caseStudyDepartments } from "@/data/case-studies";
import "@/styles/case-studies.css";

export function CaseStudiesPage() {
  return (
    <div className="zb-case-page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brand experience", href: "/brand-experience" }, { label: "Case studies" }]} />
      <section className="zb-case-hero">
        <PageShell
          eyebrow="Case studies"
          title="Projects shaped around the brief."
          description="Selected examples of how ZOBHUNGER has supported clients through field execution, onboarding, consumer engagement and project-led operations."
          actions={<ActionLink href="#case-study-projects">Explore projects <ArrowRight className="size-4" aria-hidden="true" /></ActionLink>}
        />
        <aside className="zb-case-hero-panel">
          <Layers3 aria-hidden="true" />
          <span className="zb-eyebrow">Department-wise experience</span>
          <h2>One project format. Different execution problems.</h2>
          <p>Each case study is organised around the objective, work delivered and practical outcome, making the experience easy to evaluate without turning the page into a logo wall.</p>
        </aside>
      </section>

      <section id="case-study-projects" className="zb-case-section" aria-labelledby="case-projects-title">
        <div className="zb-case-section-heading">
          <div><span className="zb-eyebrow">Selected projects</span><h2 id="case-projects-title">Experience by department.</h2></div>
          <p>{caseStudyDepartments.length} departments represented today. The structure is ready to grow as additional approved project material is supplied.</p>
        </div>
        {caseStudyDepartments.map((department) => {
          const studies = caseStudies.filter((study) => study.department === department);
          return (
            <section key={department} className="zb-case-department" aria-labelledby={`department-${studies[0].slug}`}>
              <div className="zb-case-department-heading">
                <BriefcaseBusiness aria-hidden="true" />
                <div><span>Department</span><h2 id={`department-${studies[0].slug}`}>{department}</h2></div>
              </div>
              <div className="zb-case-grid">
                {studies.map((study, index) => <CaseStudyCard key={study.slug} study={study} index={index} />)}
              </div>
            </section>
          );
        })}
      </section>
      <div className="zb-case-section"><CTASection title="Have an execution brief of your own?" description="Share the requirement, locations and outcome you need. Our team can shape the right workforce and execution model around it." href="/hire-workforce" label="Discuss your requirement" /></div>
    </div>
  );
}
