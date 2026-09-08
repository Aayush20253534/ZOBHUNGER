import { ArrowLeft, Check, Target, Wrench, TrendingUp } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import type { CaseStudy } from "@/data/case-studies";
import "@/styles/case-studies.css";

export function CaseStudyDetail({ study }: { study: CaseStudy }) {
  return (
    <div className="zb-case-page zb-case-detail zb-case-detail-compact">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Case studies", href: "/case-studies" }, { label: study.title }]} />

      <header className="zb-case-detail-hero zb-case-detail-hero-compact">
        <div>
          <span className="zb-eyebrow">{study.category}</span>
          <h1>{study.title}</h1>
          <p>{study.about}</p>
          <ActionLink href="/case-studies" variant="secondary"><ArrowLeft className="size-4" aria-hidden="true" /> All case studies</ActionLink>
        </div>
        <aside>
          <span>Industry</span>
          <strong>{study.industry}</strong>
          <span>Client type</span>
          <strong>{study.clientType}</strong>
          <div className="zb-case-detail-service-tags">
            {study.services.map((item) => <span key={item}>{item}</span>)}
          </div>
        </aside>
      </header>

      <section className="zb-case-brief-grid" aria-label={`${study.title} case study`}>
        <article>
          <Target aria-hidden="true" />
          <span className="zb-eyebrow">Challenges</span>
          <h2>What needed to be solved.</h2>
          <ul>{study.challenges.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
        </article>
        <article>
          <Wrench aria-hidden="true" />
          <span className="zb-eyebrow">Solution</span>
          <h2>How the work is structured.</h2>
          <ul>{study.solution.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
        </article>
        <article className="zb-case-results-card">
          <TrendingUp aria-hidden="true" />
          <span className="zb-eyebrow">Results</span>
          <h2>What the model enables.</h2>
          <ul>{study.results.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
        </article>
      </section>

      <div className="zb-case-section">
        <CTASection
          title="Need a similar execution model?"
          description="Tell us what needs to happen on the ground and where. We'll help structure the workforce and delivery approach."
          href="/contact"
          label="Talk to our team"
        />
      </div>
    </div>
  );
}
