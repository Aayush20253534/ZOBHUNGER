import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  CalendarClock,
  Check,
  Flag,
  Headset,
  Megaphone,
  Store,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { IntroPanel } from "@/components/common/IntroPanel";
import { ProcessFlow } from "@/components/common/ProcessFlow";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { SolutionCard } from "@/components/solutions/SolutionCard";
import { Card } from "@/components/ui/card";
import { industries } from "@/data/industries";
import { solutionDetails } from "@/data/solution-details";
import { solutions } from "@/data/solutions";
import type { SolutionDetailContent } from "@/types/solution-detail.types";
import "@/styles/solutions.css";

const icons = {
  "workforce-solutions": UsersRound,
  "sales-force": TrendingUp,
  "promoter-solutions": Megaphone,
  "retail-execution": Store,
  "brand-activation": Flag,
  "business-operations": Headset,
  "gig-workforce": CalendarClock,
};

export function SolutionDetail({ slug }: { slug: string }) {
  const solution = solutions.find((item) => item.slug === slug);
  if (!solution) notFound();
  const detail: SolutionDetailContent = solutionDetails[solution.slug];
  const Icon = icons[solution.slug];
  // Part 5's requirement form can consume this existing catalogue slug.
  const requirementHref = `/hire-workforce?service=${encodeURIComponent(solution.slug)}`;
  const relevantIndustries = industries.filter((industry) =>
    detail.industrySlugs.includes(industry.slug),
  );
  const relatedSolutions = solutions.filter((item) =>
    detail.relatedSlugs.includes(item.slug),
  );

  return (
    <div className="zb-solutions" data-solution={solution.slug}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Solutions", href: "/solutions" },
          { label: solution.label },
        ]}
      />
      <div className="zb-solution-hero">
        <PageShell
          eyebrow={solution.title}
          title={detail.heading}
          description={detail.description}
          actions={
            <>
              <ActionLink href={requirementHref}>{detail.cta.label}</ActionLink>
              <ActionLink href="#solution-services" variant="secondary">
                See services
              </ActionLink>
            </>
          }
        />
        <IntroPanel
          id="solution-brief-heading"
          icon={<Icon />}
          title="Built for your requirement"
          description={detail.bestFor}
          items={detail.facts}
        />
      </div>
      <nav
        className="zb-solution-jump-nav"
        aria-label={`${solution.label} page sections`}
      >
        <a href="#solution-services">Services</a>
        <a href={`#${detail.focus.id}`}>{detail.focus.label}</a>
        <a href="#solution-process">Delivery process</a>
        <a href="#solution-industries">Industries</a>
      </nav>
      <section
        id="solution-services"
        className="zb-solution-section"
        aria-labelledby="solution-services-heading"
      >
        <SectionHeading
          id="solution-services-heading"
          eyebrow="What we provide"
          title={detail.servicesHeading}
          description={detail.servicesDescription}
        />
        <ul className="zb-solution-service-grid" role="list">
          {detail.services.map((service) => (
            <li key={service.title}>
              <Card className="zb-card zb-solution-service-card">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
      <section
        id={detail.focus.id}
        className="zb-solution-section zb-solution-focus"
        aria-labelledby="solution-focus-heading"
      >
        <SectionHeading
          id="solution-focus-heading"
          eyebrow={detail.focus.label}
          title={detail.focus.heading}
          description={detail.focus.description}
        />
        <ul
          className="zb-solution-focus-grid"
          role="list"
          data-count={detail.focus.items.length}
        >
          {detail.focus.items.map((item) => (
            <li key={item.title}>
              <Check aria-hidden="true" />
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section
        id="solution-process"
        className="zb-solution-section"
        aria-labelledby="solution-process-heading"
      >
        <SectionHeading
          id="solution-process-heading"
          eyebrow="How it works"
          title={detail.process.heading}
          description={detail.process.description}
        />
        <ProcessFlow
          steps={detail.process.steps}
          label={`${solution.label} delivery steps`}
          action={{ href: requirementHref, label: detail.cta.label }}
        />
      </section>
      <section
        id="solution-industries"
        className="zb-solution-section zb-solution-industries"
        aria-labelledby="solution-industries-heading"
      >
        <SectionHeading
          id="solution-industries-heading"
          eyebrow="Industries"
          title="Built around your sector."
          description="Explore the wider workforce and execution requirements in your industry."
          action={
            <ActionLink href="/industries" variant="text">
              All industries
            </ActionLink>
          }
        />
        <ul className="zb-solution-industry-links" role="list">
          {relevantIndustries.map((industry) => (
            <li key={industry.slug}>
              <Link href={`/industries/${industry.slug}`}>
                {industry.title}
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section
        className="zb-solution-section"
        aria-labelledby="solution-related-heading"
      >
        <SectionHeading
          id="solution-related-heading"
          eyebrow="Connected services"
          title="Bring the rest of the work together."
          description="Explore complementary services when your requirement involves more than one team."
          action={
            <ActionLink href="/solutions" variant="text">
              All solutions
            </ActionLink>
          }
        />
        <div className="zb-solution-related">
          {relatedSolutions.map((related) => (
            <SolutionCard key={related.slug} solution={related} />
          ))}
        </div>
      </section>
      <div className="zb-solution-section">
        <CTASection {...detail.cta} href={requirementHref} />
      </div>
    </div>
  );
}
