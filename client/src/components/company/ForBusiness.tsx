import Link from "next/link";
import { VendorInvitation } from "@/components/vendors/VendorInvitation";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  LogIn,
  Handshake,
  Megaphone,
  Store,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { BusinessWorkspacePreview } from "./BusinessWorkspacePreview";
import { PageShell } from "@/components/common/PageShell";
import { PublicVisualStory } from "@/components/common/PublicVisualStory";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/card";
import {
  briefChecklist,
  businessNeeds,
  businessQuestions,
} from "@/data/company";
import "@/styles/company.css";
import "@/styles/business-entry.css";

const icons = {
  workforce: Users,
  sales: BriefcaseBusiness,
  promoters: Megaphone,
  execution: Store,
  verification: ShieldCheck,
  branding: Megaphone,
};

const gettingStarted = [
  { title: "Share your requirement", description: "Tell us the roles, team size, locations, timeline and work you need completed. You can start without a business account.", icon: ClipboardCheck },
  { title: "Shape the right team", description: "ZOBHUNGER reviews the brief and coordinates the relevant sourcing, screening and execution plan around it.", icon: Users },
  { title: "Manage delivery", description: "Approved business users can use the Business Portal to follow requirements, candidates, deployments, attendance approvals and reports.", icon: Building2 },
] as const;

const accountQuestions = [
  { question: "Do I need a business account to share a requirement?", answer: "No. You can submit a workforce or execution requirement directly from the public Hire Workforce form. If your organisation already has approved portal access, use Business login to manage ongoing work." },
  { question: "What can approved business users manage?", answer: "The Business Portal brings company details, requirements, candidate review, deployments, attendance approvals and reports into one authorised workspace." },
  { question: "Where do I log in next time?", answer: "Use Business login at the top of this page or in the For business section of the website footer. Sign in with the credentials issued to your approved account." },
] as const;

export function ForBusiness() {
  return (
    <div className="zb-company zb-for-business">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "For Business" }]}
      />
      <div className="zb-business-access-hero">
        <PageShell
          eyebrow="For businesses & clients"
          title="Hire workforce. Keep execution connected."
          description="Start with the roles, locations, team size and work you need completed. ZOBHUNGER connects hiring with deployment and execution, while approved business users can manage ongoing activity from one workspace."
          actions={
            <>
              <ActionLink href="/hire-workforce"><ClipboardCheck aria-hidden="true" className="size-4" />Hire Workforce</ActionLink>
              <ActionLink href="/business/login" variant="secondary"><LogIn aria-hidden="true" className="size-4" />Business login</ActionLink>
            </>
          }
        >
          <p className="zb-business-access-help">Looking to collaborate independently rather than hire a team?{" "}<ActionLink href="/become-a-partner" variant="text">Become a Partner<ArrowUpRight aria-hidden="true" className="size-4" /></ActionLink></p>
        </PageShell>
        <BusinessWorkspacePreview />
      </div>

      <PublicVisualStory
        eyebrow="Execution in view"
        title="From hiring to field delivery."
        description="See how workforce, customer-facing teams and coordination come together across a business requirement."
        items={[
          { visual: "workforce-hiring", title: "Build the right workforce", description: "Recruitment starts with role fit, screening and joining coordination rather than simply collecting profiles.", href: "/workforce-solutions", linkLabel: "Explore workforce solutions" },
          { visual: "field-executives", title: "Put teams closer to customers", description: "Deploy field and sales teams for market-facing work where conversations, follow-ups and coverage matter.", href: "/sales-force", linkLabel: "Explore sales force" },
          { visual: "operations-coordination", title: "Keep execution connected", description: "Coordinate updates, next actions and completion so field work remains visible after deployment.", href: "/business-operations", linkLabel: "Explore business operations" },
        ]}
      />

      <section className="zb-business-get-started" id="business-get-started" aria-labelledby="business-get-started-title">
        <div className="zb-business-get-started-heading"><div><span className="zb-eyebrow">A clear way to get started</span><h2 id="business-get-started-title">From your first brief to the field.</h2></div><Building2 aria-hidden="true" /></div>
        <ol>{gettingStarted.map(({ title, description, icon: Icon }, index) => <li key={title}><div className="zb-business-start-label"><span aria-hidden="true">0{index + 1}</span><Icon aria-hidden="true" /><h3>{title}</h3></div><p>{description}</p></li>)}</ol>
      </section>

      <section
        className="zb-company-section"
        aria-labelledby="business-needs-title"
      >
        <SectionHeading
          id="business-needs-title"
          eyebrow="Choose your starting point"
          title="What does your business need?"
          description="Explore the service closest to your requirement. A brief can bring several roles and activities together."
        />
        <div className="zb-company-grid" data-columns="2">
          {businessNeeds.map((need, index) => {
            const Icon = icons[need.id];
            return (
              <Link
                href={"/" + need.solutionSlug}
                key={need.id}
                className="zb-card-link"
              >
                <Card className="zb-card zb-business-card">
                  <div className="zb-card-top">
                    <Icon className="zb-card-icon" aria-hidden="true" />
                    <span className="zb-company-index" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="zb-card-title">{need.title}</h3>
                  <p className="zb-card-copy">{need.description}</p>
                  <ul className="zb-company-tags">
                    {need.services.map((service) => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                  <span className="zb-card-cta">
                    {need.linkLabel}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <VendorInvitation />

      <section
        className="zb-company-section zb-company-brief"
        aria-labelledby="business-brief-title"
      >
        <div>
          <span className="zb-eyebrow">A useful first conversation</span>
          <h2 id="business-brief-title">
            You bring the requirement. We start with the details.
          </h2>
          <p>
            A clear brief connects the right services with the way your business
            works.
          </p>
          <ActionLink href="/how-it-works" variant="text">
            See the delivery process{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </ActionLink>
        </div>
        <dl>
          {briefChecklist.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="zb-company-section zb-company-note" aria-labelledby="business-partner-title">
        <div>
          <h2 id="business-partner-title">Have industry expertise or business opportunities to bring?</h2>
          <p>
            Experienced professionals, consultants and business specialists can
            explore project-led collaboration through the Independent Business
            Partner Program.
          </p>
        </div>
        <ActionLink href="/become-a-partner" variant="secondary">
          Partner With Us
        </ActionLink>
      </section>

      <section
        className="zb-company-section zb-company-faq"
        aria-labelledby="business-questions-title"
      >
        <SectionHeading
          id="business-questions-title"
          eyebrow="Before you begin"
          title="A few practical questions"
          action={
            <ActionLink href="/contact" variant="text">
              Ask something else
            </ActionLink>
          }
        />
        {[...accountQuestions, ...businessQuestions].map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
      <section className="zb-company-section zb-business-entry-cta" aria-labelledby="business-account-cta-title">
        <div><h2 id="business-account-cta-title">Ready to build your next team?</h2><p>Share the requirement first. Approved business users can then keep requirements, candidates, deployment updates and approvals together in the Business Portal.</p></div>
        <div><ActionLink href="/hire-workforce" variant="light"><ClipboardCheck aria-hidden="true" className="size-4" />Hire Workforce</ActionLink><ActionLink href="/business/login" variant="secondary"><LogIn aria-hidden="true" className="size-4" />Business login</ActionLink></div>
      </section>
    </div>
  );
}
