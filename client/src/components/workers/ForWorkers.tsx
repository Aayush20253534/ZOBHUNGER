import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ClipboardList,
  Headphones,
  MapPin,
  Megaphone,
  Search,
  Store,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { PublicVisualStory } from "@/components/common/PublicVisualStory";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/card";
import { workerCategories } from "@/data/workers";
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

const workerJourney = [
  {
    icon: ClipboardList,
    title: "01 · Submit your profile",
    copy: "Complete the worker profile form with your contact details, education, experience, skills, preferred work and CV. No account is required to submit.",
    href: "/careers/apply",
    label: "Submit your profile",
  },
  {
    icon: Search,
    title: "02 · Team review & verification",
    copy: "Our team reviews the information you submitted and verifies the details needed for suitable workforce and project requirements.",
  },
  {
    icon: UserRoundCheck,
    title: "03 · Approval & fit",
    copy: "Profiles that meet the required checks are approved for further consideration based on role, location, availability and project fit.",
  },
  {
    icon: BriefcaseBusiness,
    title: "04 · Communication & next steps",
    copy: "When a relevant requirement is available, our team contacts approved workers directly and proceeds with onboarding, assignment and access as required.",
    href: "/worker/login",
    label: "Approved worker sign in",
  },
] as const;

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
          description="Submit your profile and CV first. Our team reviews and verifies the required details, and approved workers are contacted when their profile fits a suitable project or role."
          actions={
            <>
              <ActionLink href="/careers/apply">
                Submit worker profile
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink href="/worker/login" variant="secondary">
                Approved worker sign in
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
        <aside className="zb-premium-hero-card zb-worker-hero-card" aria-labelledby="worker-start-title">
          <div className="zb-premium-card-header">
            <span className="zb-premium-card-icon" aria-hidden="true">
              <Search />
            </span>
            <div>
              <span className="zb-eyebrow">Your next role</span>
              <h2 id="worker-start-title">Start with what works for you.</h2>
            </div>
          </div>
          <div className="zb-worker-highlight-list">
            <article>
              <BriefcaseBusiness aria-hidden="true" />
              <div>
                <span>Role</span>
                <strong>Sales, field, promoter &amp; operations</strong>
              </div>
            </article>
            <article>
              <MapPin aria-hidden="true" />
              <div>
                <span>Location</span>
                <strong>Choose the city or area that suits you</strong>
              </div>
            </article>
            <article>
              <UserRoundCheck aria-hidden="true" />
              <div>
                <span>Availability</span>
                <strong>Match work with your current plans</strong>
              </div>
            </article>
          </div>
          <ActionLink href="/jobs" className="zb-premium-card-action">
            {isPreview ? "Browse example roles" : "Browse open roles"}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </ActionLink>
        </aside>
      </div>

      <PublicVisualStory
        eyebrow="Work in the real world"
        title="Roles built around practical, on-ground work."
        description="Explore the kinds of assignments that can place people in stores, markets, customer conversations and delivery operations."
        items={[
          { visual: "field-executives", title: "Sales & field roles", description: "Customer-facing work that combines communication, local movement and disciplined follow-up.", href: "/jobs", linkLabel: "Browse opportunities" },
          { visual: "product-demonstration", title: "Promoter & retail roles", description: "In-store work focused on product explanation, customer engagement and a clear brand experience.", href: "/jobs", linkLabel: "Explore open roles" },
          { visual: "last-mile-delivery", title: "Operations & delivery support", description: "Execution roles where handovers, timing and coordination keep day-to-day operations moving.", href: "/jobs", linkLabel: "View all jobs" },
        ]}
      />

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
          eyebrow="Profile-first onboarding"
          title="Submit first. Review and approval come before access."
          description="Every new worker starts with the profile form. Our team reviews the submitted details, verifies the profile and communicates directly when there is a suitable project requirement."
        />
        <div className="zb-worker-category-grid zb-worker-journey-grid">
          {workerJourney.map(({ icon: Icon, title, copy, ...action }) => (
            <Card className="zb-card" key={title}>
              <Icon className="zb-card-icon" aria-hidden="true" />
              <h3 className="zb-card-title">{title}</h3>
              <p className="zb-card-copy">{copy}</p>
              {"href" in action && action.href && (
                <Link className="zb-card-cta" href={action.href}>
                  {action.label}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              )}
            </Card>
          ))}
        </div>
        <p className="zb-worker-portal-note">New workers start by <Link href="/careers/apply">submitting a profile for review</Link>. Existing approved workers can <Link href="/worker/login">sign in to their worker space</Link>.</p>
      </section>
      <div className="zb-work-section">
        <CTASection
          title="Ready to be considered for upcoming work?"
          description="Submit your worker profile and CV first. Our team will review the required details and contact you after approval when a suitable project or role is available."
          href="/careers/apply"
          label="Submit your profile"
        />
      </div>
    </div>
  );
}
