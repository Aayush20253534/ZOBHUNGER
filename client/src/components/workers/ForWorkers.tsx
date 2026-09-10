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
          description="Create your profile, explore sales, promoter, field and operations roles, apply for suitable opportunities and manage active assignments from your worker space."
          actions={
            <>
              <ActionLink href="/worker/register">
                Create worker account
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink href="/worker/login" variant="secondary">
                Worker sign in
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
          eyebrow="Your worker space"
          title="A simple start. One worker space for the journey."
          description="Create your account, build your profile, apply for opportunities and stay connected to active work, attendance and earnings."
        />
        <div className="zb-worker-category-grid zb-worker-journey-grid">
          {[{ icon: UserRoundCheck, title: "01 · Create & verify", copy: "Register with your email and phone, then confirm your email using the link in your inbox.", href: "/worker/register", label: "Create your account" }, { icon: ClipboardList, title: "02 · Build your profile", copy: "Add education, experience, skills and work preferences. Keep a private PDF copy of your CV.", href: "/worker/profile", label: "Open your profile" }, { icon: Search, title: "03 · Find & apply", copy: "Browse published openings, filter by location and work type, save roles and submit applications from your worker space.", href: "/worker/jobs", label: "Find opportunities" }, { icon: BriefcaseBusiness, title: "04 · Manage active work", copy: "Once assigned, follow assignment details, attendance and approved earnings from the same worker account.", href: "/worker/assignments", label: "View assignments" }].map(({ icon: Icon, title, copy, href, label }) => <Link className="zb-card-link" href={href} key={href}><Card className="zb-card"><Icon className="zb-card-icon" aria-hidden="true" /><h3 className="zb-card-title">{title}</h3><p className="zb-card-copy">{copy}</p><span className="zb-card-cta">{label}<ArrowUpRight className="size-4" aria-hidden="true" /></span></Card></Link>)}
        </div>
        <p className="zb-worker-portal-note">Already have an account? <Link href="/worker/login">Sign in to your worker space</Link>. You can also <Link href="/jobs">browse public job listings</Link> before joining.</p>
      </section>
      <div className="zb-work-section">
        <CTASection
          title="Find work that fits your skills and location."
          description="Explore published roles, understand the responsibilities and use your worker account to apply and follow what comes next."
          href="/jobs"
          label={isPreview ? "Browse example jobs" : "Browse jobs"}
        />
      </div>
    </div>
  );
}
