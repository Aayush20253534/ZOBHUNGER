import {
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  ClipboardCheck,
  Factory,
  GraduationCap,
  Network,
  School,
  Target,
  UserPlus,
  UsersRound,
  Wrench,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import {
  instituteBenefits,
  technicalBranches,
  technicalCellSteps,
  technicalOpportunityTypes,
} from "@/data/technical-institute-cell";
import "@/styles/technical-institute-cell.css";

const opportunityIcons = {
  jobs: BriefcaseBusiness,
  internships: GraduationCap,
  apprenticeships: Wrench,
  training: BookOpenCheck,
} as const;

export function TechnicalInstituteCell() {
  return (
    <div className="zb-tech-cell">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "ITI & Polytechnic College Cell" },
        ]}
      />

      <section className="zb-tech-hero">
        <div className="zb-tech-hero-copy">
          <span className="zb-tech-kicker"><Wrench aria-hidden="true" /> ITI & Polytechnic College Cell</span>
          <PageShell
            title="Build a Stronger Technical Talent Pipeline"
            description="A dedicated ZOBHUNGER partnership channel for ITIs, Polytechnic colleges and technical institutes to connect skilled students with jobs, internships, apprenticeships and training based on qualification, trade, skills and eligibility."
            actions={
              <>
                <ActionLink href="/iti-polytechnic-cell/apply">
                  Partner Your Institute
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </ActionLink>
                <ActionLink href="#student-opportunities" variant="secondary">
                  Explore Opportunities
                </ActionLink>
              </>
            }
          />
          <div className="zb-tech-hero-assurances" aria-label="Program focus">
            <span><BadgeCheck aria-hidden="true" /> Technical qualifications</span>
            <span><Target aria-hidden="true" /> Eligibility-led matching</span>
            <span><Network aria-hidden="true" /> Institute-to-employer network</span>
          </div>
        </div>

        <aside className="zb-tech-network" aria-label="Technical talent pathway">
          <div className="zb-tech-network-top">
            <span className="zb-tech-network-mark"><School aria-hidden="true" /></span>
            <div>
              <span className="zb-eyebrow">Technical talent network</span>
              <h2>Institute to industry. One focused technical cell.</h2>
            </div>
          </div>
          <div className="zb-tech-network-flow" aria-hidden="true">
            <div className="zb-tech-network-column">
              <span>ITI</span>
              <span>Polytechnic</span>
            </div>
            <i />
            <div className="zb-tech-network-hub">
              <strong>ZOBHUNGER</strong>
              <span>Technical Cell</span>
            </div>
            <i />
            <div className="zb-tech-network-column zb-tech-network-column--outcomes">
              <span>Jobs</span>
              <span>Internships</span>
              <span>Apprenticeships</span>
              <span>Training</span>
            </div>
          </div>
          <div className="zb-tech-network-foot">
            <span><UsersRound aria-hidden="true" /> Skilled candidates</span>
            <span><Factory aria-hidden="true" /> Technical hiring</span>
          </div>
        </aside>
      </section>

      <section className="zb-tech-distinction" aria-labelledby="tech-distinction-title">
        <div className="zb-tech-distinction-heading">
          <span className="zb-eyebrow">A separate technical hiring channel</span>
          <h2 id="tech-distinction-title">Different from the general Placement Cell.</h2>
          <p>
            The existing Placement Cell supports broad institutional hiring. The ITI & Polytechnic College Cell is purpose-built for technical qualifications, skilled trades, diploma branches, apprenticeships and industry-specific technical requirements.
          </p>
        </div>
        <div className="zb-tech-distinction-grid">
          <article>
            <span className="zb-tech-distinction-icon"><Building2 aria-hidden="true" /></span>
            <span className="zb-eyebrow">General Placement Cell</span>
            <h3>Broad campus opportunity access</h3>
            <p>Supports students and institutions across general educational streams and multiple work categories.</p>
            <ActionLink href="/placement-cell-partnership" variant="text">View general Placement Cell <ArrowUpRight aria-hidden="true" /></ActionLink>
          </article>
          <article className="zb-tech-distinction-featured">
            <span className="zb-tech-distinction-icon"><Wrench aria-hidden="true" /></span>
            <span className="zb-eyebrow">ITI & Polytechnic Cell</span>
            <h3>Technical talent and skilled hiring</h3>
            <p>Focuses on ITI trades, Diploma and Polytechnic branches, technical roles, apprenticeships and skill-led sourcing.</p>
            <ActionLink href="/iti-polytechnic-cell/apply" variant="text">Onboard technical institute <ArrowUpRight aria-hidden="true" /></ActionLink>
          </article>
        </div>
      </section>

      <section id="student-opportunities" className="zb-tech-section" aria-labelledby="tech-opportunities-title">
        <SectionHeading
          id="tech-opportunities-title"
          eyebrow="Student opportunities"
          title="Four pathways, matched to technical eligibility."
          description="Students from associated institutes can be considered for opportunities according to qualification, trade or branch, skills, location, employer criteria and active requirements."
        />
        <div className="zb-tech-opportunity-grid">
          {technicalOpportunityTypes.map((opportunity, index) => {
            const Icon = opportunityIcons[opportunity.id];
            return (
              <article key={opportunity.id}>
                <div className="zb-tech-opportunity-top">
                  <span><Icon aria-hidden="true" /></span>
                  <small>0{index + 1}</small>
                </div>
                <h3>{opportunity.title}</h3>
                <p>{opportunity.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="zb-tech-section zb-tech-for-institutes" aria-labelledby="tech-institutes-title">
        <div className="zb-tech-institute-copy">
          <span className="zb-eyebrow">For ITIs & Polytechnic colleges</span>
          <h2 id="tech-institutes-title">Create a structured bridge between your students and industry demand.</h2>
          <p>
            ZOBHUNGER works with institute placement and training teams to build a technical talent network that can respond to real hiring, apprenticeship and training requirements.
          </p>
          <ul>
            {instituteBenefits.map((benefit) => (
              <li key={benefit}><Check aria-hidden="true" />{benefit}</li>
            ))}
          </ul>
          <ActionLink href="/iti-polytechnic-cell/apply">
            Start Institute Onboarding
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </ActionLink>
        </div>
        <div className="zb-tech-talent-card">
          <div className="zb-tech-talent-card-head">
            <span><GraduationCap aria-hidden="true" /></span>
            <div><small>Technical candidate profile</small><strong>Qualification-led sourcing</strong></div>
          </div>
          <dl>
            <div><dt>Qualification</dt><dd>ITI / Diploma</dd></div>
            <div><dt>Trade / Branch</dt><dd>Role relevant</dd></div>
            <div><dt>Skills</dt><dd>Technical + practical</dd></div>
            <div><dt>Eligibility</dt><dd>Requirement based</dd></div>
            <div><dt>Location</dt><dd>Candidate preference</dd></div>
          </dl>
          <div className="zb-tech-talent-result">
            <ClipboardCheck aria-hidden="true" />
            <div><small>Outcome</small><strong>Relevant opportunity shortlist</strong></div>
          </div>
        </div>
      </section>

      <section className="zb-tech-section" aria-labelledby="tech-process-title">
        <SectionHeading
          id="tech-process-title"
          eyebrow="Partnership journey"
          title="A controlled path from institute onboarding to student opportunity matching."
          description="The same verified institute record now supports student onboarding, technical talent verification and requirement-led matching across jobs, internships, apprenticeships and training."
        />
        <ol className="zb-tech-process">
          {technicalCellSteps.map((step, index) => (
            <li key={step.title}>
              <span>0{index + 1}</span>
              <div><h3>{step.title}</h3><p>{step.description}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="zb-tech-section zb-tech-trades" aria-labelledby="tech-trades-title">
        <div>
          <span className="zb-eyebrow">Technical disciplines</span>
          <h2 id="tech-trades-title">Designed for trade and branch-specific sourcing.</h2>
          <p>
            Institute onboarding captures the actual trades and branches available on campus so future requirements can be mapped against relevant student pools instead of treating every candidate as interchangeable.
          </p>
        </div>
        <div className="zb-tech-trade-cloud" aria-label="Example technical trades and branches">
          {technicalBranches.map((branch) => <span key={branch}>{branch}</span>)}
        </div>
      </section>

      <section className="zb-tech-section zb-tech-student-path" aria-labelledby="tech-student-path-title">
        <div className="zb-tech-student-path-copy">
          <span className="zb-eyebrow">For students</span>
          <h2 id="tech-student-path-title">Education and skills should lead to the right next step.</h2>
          <p>
            Students from associated Placement Cells can receive Job, Training, Internship and Apprenticeship opportunities according to their qualifications, skills and eligibility. Opportunity availability depends on active requirements and selection criteria.
          </p>
          <ActionLink href="/iti-polytechnic-cell/student-registration" variant="secondary">
            Register Technical Student
            <UserPlus aria-hidden="true" className="size-4" />
          </ActionLink>
        </div>
        <div className="zb-tech-student-path-flow" aria-label="Student opportunity matching factors">
          <span>Education</span><i />
          <span>Trade / Branch</span><i />
          <span>Skills</span><i />
          <span>Eligibility</span><i />
          <strong>Right Opportunity</strong>
        </div>
      </section>

      <CTASection
        title="Bring your ITI or Polytechnic into the technical talent network."
        description="Submit your institute profile and partnership requirements for review by the ZOBHUNGER team."
        href="/iti-polytechnic-cell/apply"
        label="Partner Your Institute"
      />
    </div>
  );
}
