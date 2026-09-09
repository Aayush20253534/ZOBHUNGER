import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  KeyRound,
  LogIn,
  Handshake,
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
  { title: "Apply to partner", description: "Share your company, experience and partnership interests. No account or password is needed to apply.", icon: Handshake },
  { title: "Company review", description: "Our team reviews your application and contacts you if more information is needed.", icon: ClipboardCheck },
  { title: "Activate your access", description: "After approval, receive your unique Partner ID and temporary password. Change it on your first login.", icon: KeyRound },
] as const;

const accountQuestions = [
  { question: "How do I create a business account?", answer: "Submit the Become a Partner application. Our company team reviews it in the admin portal. After approval, your account is created and your Partner ID and temporary password are issued. You must choose a new password on your first login." },
  { question: "Where do I log in next time?", answer: "Use Business login at the top of this page or in the For business section of the website footer. Sign in with your Partner ID and password. An approved account email also works." },
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
          description="Hire, deploy and stay connected to your team with ZOBHUNGER. Apply to become a partner. Once approved, access one workspace to manage requirements, review candidates and follow field execution."
          actions={
            <>
              <ActionLink href="/become-a-partner#partner-application"><Handshake aria-hidden="true" className="size-4" />Become a Partner</ActionLink>
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
        <div><h2 id="business-account-cta-title">Your next team starts here.</h2><p>Apply for business access and bring your requirements, people and work updates together after approval.</p></div>
        <div><ActionLink href="/become-a-partner#partner-application" variant="light"><Handshake aria-hidden="true" className="size-4" />Become a Partner</ActionLink><ActionLink href="/business/login" variant="secondary"><LogIn aria-hidden="true" className="size-4" />Business login</ActionLink></div>
      </section>
    </div>
  );
}
