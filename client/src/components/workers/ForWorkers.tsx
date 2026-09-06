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
                {isPreview ? "Explore demo jobs" : "Explore jobs"}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink href="#worker-journey" variant="secondary">
                How to get started
              </ActionLink>
            </>
          }
        />
        <aside className="zb-worker-start" aria-labelledby="worker-start-title">
          <Search aria-hidden="true" />
          <span className="zb-eyebrow">Choose your starting point</span>
          <h2 id="worker-start-title">
            Find the role that fits the way you work.
          </h2>
          <dl>
            <div>
              <dt>Your skills</dt>
              <dd>The kind of work you know or want to learn.</dd>
            </div>
            <div>
              <dt>Your location</dt>
              <dd>The city or area where you want to work.</dd>
            </div>
            <div>
              <dt>Your availability</dt>
              <dd>The type of engagement that fits your plans.</dd>
            </div>
          </dl>
        </aside>
      </div>
      {isPreview && (
        <div className="zb-jobs-demo-note">
          <span className="zb-chip">Frontend preview</span>
          <p>
            Jobs shown here are examples. Applications are previews and are not
            sent to an employer.
          </p>
        </div>
      )}
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
        <ol className="zb-worker-journey">
          {workerJourney.map((step, index) => (
            <li key={step.title}>
              <span aria-hidden="true">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
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
          label={isPreview ? "Browse demo jobs" : "Browse jobs"}
        />
      </div>
    </div>
  );
}
