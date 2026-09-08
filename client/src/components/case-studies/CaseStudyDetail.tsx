import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  MapPinned,
  Target,
  TrendingUp,
  UsersRound,
  Wrench,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import type { CaseStudy } from "@/data/case-studies";
import "@/styles/case-studies.css";

const journey = [
  { label: "01", title: "Requirement", copy: "Define the market, role and field outcome." },
  { label: "02", title: "Deploy", copy: "Mobilise the right on-ground team." },
  { label: "03", title: "Verify", copy: "Track activity, quality and completion." },
  { label: "04", title: "Scale", copy: "Repeat the operating model across locations." },
] as const;

export function CaseStudyDetail({ study }: { study: CaseStudy }) {
  return (
    <div className="zb-case-page zb-case-detail zb-case-detail-rich">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Case studies", href: "/case-studies" },
          { label: study.title },
        ]}
      />

      <header className="zb-case-detail-hero zb-case-detail-hero-rich">
        <div className="zb-case-detail-lead">
          <span className="zb-eyebrow">{study.category}</span>
          <h1>{study.title}</h1>
          <p>{study.about}</p>
          <ActionLink href="/case-studies" variant="secondary">
            <ArrowLeft className="size-4" aria-hidden="true" /> All case studies
          </ActionLink>
        </div>

        <aside className="zb-case-snapshot" aria-label="Project snapshot">
          <div className="zb-case-snapshot-icon"><BriefcaseBusiness aria-hidden="true" /></div>
          <span className="zb-eyebrow">Project snapshot</span>
          <dl>
            <div><dt>Industry</dt><dd>{study.industry}</dd></div>
            <div><dt>Client type</dt><dd>{study.clientType}</dd></div>
            <div><dt>Execution scope</dt><dd>{study.services.length} service areas</dd></div>
          </dl>
          <div className="zb-case-detail-service-tags">
            {study.services.map((item) => <span key={item}>{item}</span>)}
          </div>
        </aside>
      </header>

      <section className="zb-case-narrative" aria-labelledby="case-about-title">
        <div className="zb-case-narrative-copy">
          <span className="zb-eyebrow">About the project</span>
          <h2 id="case-about-title">The operating requirement behind the brief.</h2>
          <p>{study.about}</p>
        </div>

        <div className="zb-case-journey" aria-label="Typical execution journey">
          {journey.map((step, index) => (
            <div className="zb-case-journey-step" key={step.label}>
              <span>{step.label}</span>
              <strong>{step.title}</strong>
              <p>{step.copy}</p>
              {index < journey.length - 1 ? <ArrowRight aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="zb-case-deep-grid" aria-label={`${study.title} challenge and solution`}>
        <article className="zb-case-deep-section zb-case-challenge-section">
          <div className="zb-case-deep-heading">
            <div className="zb-case-deep-icon"><Target aria-hidden="true" /></div>
            <div>
              <span className="zb-eyebrow">Challenges</span>
              <h2>What had to be solved on the ground.</h2>
            </div>
          </div>
          <p className="zb-case-deep-intro">
            The requirement is not simply to add people. The field model has to remove operational friction while keeping onboarding, coverage and quality consistent across locations.
          </p>
          <ol className="zb-case-detail-list">
            {study.challenges.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="zb-case-deep-section zb-case-solution-section">
          <div className="zb-case-deep-heading">
            <div className="zb-case-deep-icon"><Wrench aria-hidden="true" /></div>
            <div>
              <span className="zb-eyebrow">Solution</span>
              <h2>How the execution model is structured.</h2>
            </div>
          </div>
          <p className="zb-case-deep-intro">
            ZOBHUNGER structures the work as a repeatable field operation: source or deploy the team, execute the activity, verify completion and keep the client view clear enough to act on.
          </p>
          <ol className="zb-case-detail-list zb-case-solution-list">
            {study.solution.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="zb-case-results-rich" aria-labelledby="case-results-title">
        <div className="zb-case-results-heading">
          <div className="zb-case-results-icon"><TrendingUp aria-hidden="true" /></div>
          <div>
            <span className="zb-eyebrow">Results</span>
            <h2 id="case-results-title">What the operating model is designed to enable.</h2>
            <p>
              The emphasis is on practical execution outcomes: stronger coverage, cleaner verification, faster mobilisation and better visibility into what is happening in the field.
            </p>
          </div>
        </div>

        <div className="zb-case-results-grid">
          {study.results.map((item, index) => (
            <article key={item}>
              <div><Check aria-hidden="true" /></div>
              <span>Outcome {String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>

        <div className="zb-case-proof-band" aria-label="Execution controls">
          <div><UsersRound aria-hidden="true" /><span>People</span><strong>Right team for the task</strong></div>
          <div><MapPinned aria-hidden="true" /><span>Coverage</span><strong>Location-led deployment</strong></div>
          <div><ClipboardCheck aria-hidden="true" /><span>Control</span><strong>Verification & reporting</strong></div>
        </div>
      </section>

      <div className="zb-case-section zb-case-detail-cta">
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
