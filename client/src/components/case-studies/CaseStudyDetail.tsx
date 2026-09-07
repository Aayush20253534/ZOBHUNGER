import { ArrowLeft, Check, Target, Workflow } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import type { CaseStudy } from "@/data/case-studies";
import "@/styles/case-studies.css";

export function CaseStudyDetail({ study }: { study: CaseStudy }) {
  return <div className="zb-case-page zb-case-detail">
    <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Case studies", href: "/case-studies" }, { label: study.brand }]} />
    <header className="zb-case-detail-hero">
      <div>
        <span className="zb-eyebrow">{study.department}</span>
        <div className="zb-case-detail-brand">{study.brand}</div>
        <h1>{study.title}</h1>
        <p>{study.summary}</p>
        <ActionLink href="/case-studies" variant="secondary"><ArrowLeft className="size-4" aria-hidden="true" /> All case studies</ActionLink>
      </div>
      <aside>
        <span>Project focus</span>
        <strong>{study.category}</strong>
        <ul>{study.capabilities.map((item) => <li key={item}>{item}</li>)}</ul>
      </aside>
    </header>

    <section className="zb-case-detail-track" aria-labelledby="case-execution-track">
      <div className="zb-case-detail-track-heading">
        <Workflow aria-hidden="true" />
        <div>
          <span className="zb-eyebrow">Execution track</span>
          <h2 id="case-execution-track">From project objective to field outcome.</h2>
        </div>
      </div>
      <ol>
        <li><span>01</span><strong>Objective</strong><p>Define the project outcome and operating requirement.</p></li>
        <li><span>02</span><strong>Mobilise</strong><p>Structure outreach, people and field-level coordination.</p></li>
        <li><span>03</span><strong>Execute</strong><p>Deliver the approved activities through the field team.</p></li>
        <li><span>04</span><strong>Outcome</strong><p>Connect the execution back to the intended project result.</p></li>
      </ol>
    </section>

    <section className="zb-case-story-grid">
      <article className="zb-case-story-block zb-case-objective">
        <Target aria-hidden="true" /><span className="zb-eyebrow">Objective</span><h2>What the project needed to achieve.</h2><p>{study.objective}</p>
      </article>
      <article className="zb-case-story-block zb-case-execution-block">
        <span className="zb-eyebrow">Our execution</span><h2>How the work was structured.</h2>
        <ol className="zb-case-execution-list">{study.execution.map((item, index) => <li key={item}><span className="zb-case-execution-number">{String(index + 1).padStart(2, "0")}</span><Check aria-hidden="true" /><span>{item}</span></li>)}</ol>
      </article>
      <article className="zb-case-story-block zb-case-impact">
        <div><span className="zb-eyebrow">Impact</span><h2>What the execution enabled.</h2></div>
        <p>{study.impact}</p>
      </article>
    </section>
    <div className="zb-case-section"><CTASection title="Need a similar project execution model?" description="Tell us what needs to happen on the ground and where. We'll help structure the workforce and delivery approach." href="/contact" label="Talk to our team" /></div>
  </div>;
}
