import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ClipboardList,
  Headphones,
  Megaphone,
  Search,
  Store,
  Users,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { IntroPanel } from "@/components/common/IntroPanel";
import { ProcessFlow } from "@/components/common/ProcessFlow";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/card";
import { workerCategories, workerJourney } from "@/data/workers";
import { jobsHref } from "@/lib/job-filters";
import { getDataMode } from "@/services/adapters";
import "@/styles/work.css";

const icons = {
  Sales: BriefcaseBusiness,
  Promoter: Store,
  "Field Work": ClipboardList,
  Marketing: Megaphone,
  Telecalling: Headphones,
  Recruitment: Users,
  Operations: ClipboardList,
};

export function ForWorkers() {
  const isPreview = getDataMode() === "mock";
  return (
    <div className="zb-work">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "For Workers" }]}
      />
      <div className="zb-workers-hero">
        <PageShell
          eyebrow="For workers"
          title="Find work with ZOBHUNGER."
          description="Explore sales, promoter, field and operations roles. Start with the work you want to do and the location that suits you."
          actions={
            <>
              <ActionLink href="/jobs">
                {isPreview ? "Explore example jobs" : "Explore jobs"}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink href="#worker-journey" variant="secondary">
                How to get started
              </ActionLink>
            </>
          }
        >
          {isPreview && (
            <p className="zb-inline-notice">
              Example roles · Applications are not sent to employers yet.
            </p>
          )}
        </PageShell>
        <IntroPanel
          id="worker-start-title"
          icon={<Search />}
          eyebrow="Choose your starting point"
          title="Find the role that fits the way you work."
          items={[
            {
              label: "Your skills",
              value: "The work you know or want to learn",
            },
            {
              label: "Your location",
              value: "The city or area where you want to work",
            },
            {
              label: "Your availability",
              value: "An engagement that fits your plans",
            },
          ]}
        />
      </div>

      <section
        className="zb-work-section"
        aria-labelledby="worker-categories-title"
      >
        <SectionHeading
          id="worker-categories-title"
          eyebrow="Explore the work"
          title="Where would you like to start?"
          description="Choose a category, then narrow the roles by location or type of work."
        />
        <div className="zb-worker-category-grid">
          {workerCategories.map((item) => {
            const Icon = icons[item.category];
            return (
              <Link
                className="zb-card-link"
                href={jobsHref({ category: item.category })}
                key={item.category}
              >
                <Card className="zb-card">
                  <Icon className="zb-card-icon" aria-hidden="true" />
                  <h3 className="zb-card-title">{item.title}</h3>
                  <p className="zb-card-copy">{item.description}</p>
                  <span className="zb-card-cta">
                    Explore roles
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </Card>
              </Link>
            );
          })}
          <Link className="zb-card-link zb-worker-browse-card" href="/jobs">
            <Card className="zb-card">
              <Search className="zb-card-icon" aria-hidden="true" />
              <h3 className="zb-card-title">Still exploring your options?</h3>
              <p className="zb-card-copy">
                Compare roles across the full catalogue. Read the
                responsibilities and choose the kind of work that fits your
                skills.
              </p>
              <span className="zb-card-cta">
                View all roles
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </Card>
          </Link>
        </div>
      </section>
      <section
        id="worker-journey"
        className="zb-work-section"
        aria-labelledby="worker-journey-title"
      >
        <SectionHeading
          id="worker-journey-title"
          eyebrow="The planned worker journey"
          title="From finding a role to starting work."
          description="This is the journey ZOBHUNGER is building toward. Profile creation, selection updates and earnings tools are planned for the worker portal."
        />
        <ProcessFlow
          steps={workerJourney}
          label="The six planned worker journey steps"
          planned
          action={{
            href: "/jobs",
            label: isPreview ? "Explore example jobs" : "Explore jobs",
          }}
        />
        <p className="zb-worker-portal-note">
          Worker accounts are not open yet.{" "}
          {isPreview
            ? "You can explore the job pages and try the application preview without creating an account."
            : "You can explore the published job pages and read each role's requirements."}
        </p>
      </section>
      <div className="zb-work-section">
        <CTASection
          title="Start with the kind of work you want."
          description="Explore the roles, read the responsibilities and check the location before applying."
          href="/jobs"
          label={isPreview ? "Browse example jobs" : "Browse jobs"}
        />
      </div>
    </div>
  );
}
