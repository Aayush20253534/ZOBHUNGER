import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  UserRoundPlus,
  Megaphone,
  Store,
  Users,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { BusinessWorkspacePreview } from "./BusinessWorkspacePreview";
import { PageShell } from "@/components/common/PageShell";
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
};

const gettingStarted = [
  { title: "Create your account", description: "Register with your business email and password, then add your company details.", icon: UserRoundPlus },
  { title: "Share your requirement", description: "Add the roles, people and locations you need. Save a draft when you need more time.", icon: ClipboardList },
  { title: "Follow the work", description: "Review candidates, see deployments, approve attendance and download reports.", icon: LayoutDashboard },
] as const;

const accountQuestions = [
  { question: "How do I create a business account?", answer: "Choose Register your business on this page, sign up with your email and password, and complete your company profile. You can then submit requirements or save them as drafts." },
  { question: "Where do I log in next time?", answer: "Use Business login at the top of this page or in the For business section of the website footer. Sign in with the email and password you registered with." },
] as const;

export function ForBusiness() {
  return (
    <div className="zb-company zb-for-business">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "For Business" }]}
      />
      <div className="zb-business-access-hero">
        <PageShell
          eyebrow="For business · Your company workspace"
          title="Build your team. Manage the work."
          description="Hire, deploy and stay connected to your team with ZOBHUNGER. Create a business account to manage requirements, review candidates and follow field execution in one workspace."
          actions={
            <>
              <ActionLink href="/business/register"><UserRoundPlus aria-hidden="true" className="size-4" />Register your business</ActionLink>
              <ActionLink href="/business/login" variant="secondary"><LogIn aria-hidden="true" className="size-4" />Business login</ActionLink>
            </>
          }
        >
          <p className="zb-business-access-help">Prefer to discuss your needs first?{" "}<ActionLink href="/hire-workforce" variant="text">Share a requirement<ArrowUpRight aria-hidden="true" className="size-4" /></ActionLink></p>
        </PageShell>
        <BusinessWorkspacePreview />
      </div>

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
        <div><h2 id="business-account-cta-title">Your next team starts here.</h2><p>Create your business account and bring your requirements, people and work updates together.</p></div>
        <div><ActionLink href="/business/register" variant="light"><UserRoundPlus aria-hidden="true" className="size-4" />Register your business</ActionLink><ActionLink href="/business/login" variant="secondary"><LogIn aria-hidden="true" className="size-4" />Business login</ActionLink></div>
      </section>
    </div>
  );
}
