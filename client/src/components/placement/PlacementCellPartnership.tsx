import {
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  ClipboardList,
  Clock3,
  GraduationCap,
  Handshake,
  Laptop,
  MapPin,
  Network,
  PanelsTopLeft,
  Route,
  Sparkles,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import {
  candidateProfileFactors,
  careerDevelopment,
  earnWhileLearning,
  placementSteps,
  portalFeatures,
  studentOpportunities,
} from "@/data/placement-partnership";
import "@/styles/placement-partnership.css";

const opportunityIcons = {
  "full-time": BriefcaseBusiness,
  "part-time": Clock3,
  freelance: Laptop,
  task: ClipboardList,
  internship: GraduationCap,
  apprenticeship: BookOpenCheck,
  remote: Network,
  hybrid: Building2,
  flexible: Route,
  project: Target,
};

export function PlacementCellPartnership() {
  return (
    <div className="zb-placement-partnership">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Placement Cell Partnership" },
        ]}
      />

      <div className="zb-placement-hero">
        <PageShell
          eyebrow="Partner With ZOBHUNGER – Placement Cell & Institution"
          title="Empower Your Students With Career & Earning Opportunities"
          description="ZOBHUNGER partners with Colleges, Universities, Training Institutes and Placement Cells to connect students with suitable employment, internship, apprenticeship, freelance and flexible work opportunities."
          actions={
            <>
              <ActionLink href="/placement-cell-partnership/apply">
                Onboard Your Placement Cell
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </ActionLink>
              <ActionLink
                href="/placement-cell-partnership/apply"
                variant="secondary"
              >
                Submit Institution Details
              </ActionLink>
            </>
          }
        />

        <aside id="institution-partners" className="zb-placement-hero-card" aria-label="Institution partnership summary">
          <span className="zb-placement-hero-icon" aria-hidden="true">
            <GraduationCap />
          </span>
          <span className="zb-eyebrow">Institution partnership</span>
          <h2>Connect your campus to more ways of working.</h2>
          <p>
            Jobs, internships, freelance work, apprenticeships, training and
            flexible earning opportunities through one institutional channel.
          </p>
          <div className="zb-placement-hero-points">
            <span><BadgeCheck aria-hidden="true" /> Approved partner access</span>
            <span><Users aria-hidden="true" /> Candidate management</span>
            <span><Target aria-hidden="true" /> Opportunity matching</span>
          </div>
        </aside>
      </div>

      <p className="zb-placement-tagline">
        Connect Your Students With Jobs, Internships, Freelance Work and Career Opportunities.
      </p>

      <section className="zb-placement-section" aria-labelledby="placement-process-title">
        <SectionHeading
          id="placement-process-title"
          eyebrow="How it works"
          title="A clear path from institution onboarding to opportunity matching."
          description="The Placement Cell remains the institutional point of coordination while ZOBHUNGER provides access to relevant opportunities after approval."
        />
        <ol className="zb-placement-steps">
          {placementSteps.map((step, index) => (
            <li key={step.title}>
              <span className="zb-placement-step-number">0{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="zb-placement-section" aria-labelledby="student-opportunities-title">
        <SectionHeading
          id="student-opportunities-title"
          eyebrow="Student opportunities"
          title="Different ways for students to build experience and move forward."
          description="Opportunity availability depends on candidate fit, location, skills, requirements and active projects."
        />
        <div className="zb-placement-opportunity-grid">
          {studentOpportunities.map((opportunity) => {
            const Icon = opportunityIcons[opportunity.id];
            return (
              <article key={opportunity.id} className="zb-placement-opportunity-card">
                <Icon aria-hidden="true" />
                <h3>{opportunity.title}</h3>
              </article>
            );
          })}
        </div>
      </section>

      <section className="zb-placement-section zb-placement-earn" aria-labelledby="earn-learn-title">
        <div className="zb-placement-earn-copy">
          <span className="zb-eyebrow">Flexible earning</span>
          <h2 id="earn-learn-title">Earn While You Learn</h2>
          <p>
            Students can access suitable freelance and task-based work opportunities that may help them gain practical experience and earn income while continuing their education.
          </p>
          <p>
            Suitable opportunities can help students manage certain educational and personal expenses, subject to successful completion of assigned work and project requirements.
          </p>
        </div>
        <ul className="zb-placement-check-list">
          {earnWhileLearning.map((item) => (
            <li key={item}><Check aria-hidden="true" />{item}</li>
          ))}
        </ul>
      </section>

      <section className="zb-placement-section" aria-labelledby="career-development-title">
        <SectionHeading
          id="career-development-title"
          eyebrow="Training & career development"
          title="Build Skills Beyond the Classroom"
          description="Combine classroom learning with industry exposure, practical work and structured development opportunities."
        />
        <div className="zb-placement-development-layout">
          <div className="zb-placement-development-card">
            <span className="zb-placement-feature-icon"><Sparkles aria-hidden="true" /></span>
            <div className="zb-placement-pill-list">
              {careerDevelopment.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
          <div className="zb-placement-profile-card">
            <span className="zb-eyebrow">Who can benefit</span>
            <h3>Opportunities Based on Candidate Profile</h3>
            <p>Opportunities can be matched using practical candidate and work-preference signals.</p>
            <ul>
              {candidateProfileFactors.map((item) => (
                <li key={item}><Check aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="zb-placement-section zb-placement-portal" aria-labelledby="placement-portal-title">
        <div className="zb-placement-portal-copy">
          <span className="zb-eyebrow">Placement Cell Portal</span>
          <h2 id="placement-portal-title">One workspace for candidates and opportunities.</h2>
          <p>
            Once approved, authorized Placement Cell representatives receive dedicated portal access to manage candidate records and follow relevant opportunities.
          </p>
          <ul className="zb-placement-feature-list">
            {portalFeatures.map((feature) => (
              <li key={feature}><Check aria-hidden="true" />{feature}</li>
            ))}
          </ul>
          <ActionLink href="/placement-cell-login" variant="secondary">
            Placement Cell Login
          </ActionLink>
        </div>

        <div className="zb-placement-dashboard" aria-label="Placement Cell dashboard preview">
          <div className="zb-placement-dashboard-topbar">
            <div>
              <span className="zb-dashboard-mark"><PanelsTopLeft aria-hidden="true" /></span>
              <div><strong>Placement Cell Portal</strong><span>Institution workspace</span></div>
            </div>
            <span className="zb-dashboard-status">Approved partner</span>
          </div>
          <div className="zb-placement-dashboard-stats">
            <article><Users aria-hidden="true" /><span>Candidates</span><strong>126</strong></article>
            <article><BriefcaseBusiness aria-hidden="true" /><span>Opportunities</span><strong>24</strong></article>
            <article><Handshake aria-hidden="true" /><span>Applications</span><strong>38</strong></article>
          </div>
          <div className="zb-placement-dashboard-table">
            <div className="zb-dashboard-table-heading"><strong>Recent candidate activity</strong><span>Status</span></div>
            <div><span><i>AS</i><b>Candidate profile</b></span><em>Matched</em></div>
            <div><span><i>RK</i><b>Internship application</b></span><em>Review</em></div>
            <div><span><i>PM</i><b>Candidate profile</b></span><em>Active</em></div>
          </div>
        </div>
      </section>

      <div className="zb-placement-section zb-placement-final-cta">
        <CTASection
          title="Create More Opportunities for Your Students"
          description="Partner with ZOBHUNGER and help connect your students with relevant jobs, internships, apprenticeships, training, certifications and flexible earning opportunities."
          href="/placement-cell-partnership/apply"
          label="Onboard Your Placement Cell"
        />
      </div>
    </div>
  );
}
