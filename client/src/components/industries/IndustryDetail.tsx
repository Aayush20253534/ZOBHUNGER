import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ClipboardList } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { IndustryIcon } from "@/components/industries/IndustryIcon";
import { Card } from "@/components/ui/card";
import { getIndustryContent } from "@/lib/industry-content";
import "@/styles/industries.css";

export function IndustryDetail({ slug }: { slug: string }) {
  const content = getIndustryContent(slug);
  if (!content) notFound();
  const { industry, detail } = content;
  // The later requirement form can use this validated catalogue slug as its initial industry.
  const requirementHref = `/hire-workforce?industry=${encodeURIComponent(industry.slug)}`;

  return (
    <div className="zb-industries" data-industry={industry.slug}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Industries", href: "/industries" },
          { label: industry.title },
        ]}
      />
      <div className="zb-industry-hero">
        <PageShell
          eyebrow={`${industry.title} / Workforce & execution`}
          title={detail.heading}
          description={detail.description}
          actions={
            <>
              <ActionLink href={requirementHref}>{detail.cta.label}</ActionLink>
              <ActionLink href="#industry-services" variant="secondary">
                Explore services
              </ActionLink>
            </>
          }
        />
        <aside
          className="zb-industry-context"
          aria-labelledby="industry-context-heading"
        >
          <IndustryIcon slug={industry.slug} />
          <h2 id="industry-context-heading">Your industry, in focus.</h2>
          <dl>
            {detail.context.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
      <nav
        className="zb-industry-jump-nav"
        aria-label={`${industry.title} page sections`}
      >
        <a href="#industry-services">Services</a>
        <a href="#industry-scenarios">Example requirements</a>
        <a href="#industry-brief">Your requirement brief</a>
      </nav>
      <section
        id="industry-services"
        className="zb-industry-section"
        aria-labelledby="industry-services-heading"
      >
        <SectionHeading
          id="industry-services-heading"
          eyebrow="Relevant services"
          title={detail.servicesHeading}
          description={detail.servicesDescription}
          action={
            <ActionLink href="/solutions" variant="text">
              All solutions
            </ActionLink>
          }
        />
        <ul className="zb-industry-services-grid" role="list">
          {detail.services.map((service) => (
            <li key={service.title}>
              <Link
                href={`/${service.solutionSlug}`}
                className="zb-card-link"
                aria-label={`Explore ${service.title} solutions`}
              >
                <Card className="zb-card zb-industry-service-card">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <span className="zb-card-cta">
                    Explore the solution{" "}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section
        id="industry-scenarios"
        className="zb-industry-section zb-industry-scenarios"
        aria-labelledby="industry-scenarios-heading"
      >
        <SectionHeading
          id="industry-scenarios-heading"
          eyebrow="Example requirements"
          title={detail.scenariosHeading}
          description="Use these examples to think through the work, then adapt the brief to your business."
        />
        <div className="zb-industry-scenario-grid">
          {detail.scenarios.map((scenario) => (
            <article key={scenario.title}>
              <Check aria-hidden="true" />
              <h3>{scenario.title}</h3>
              <p>{scenario.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        id="industry-brief"
        className="zb-industry-section zb-industry-brief"
        aria-labelledby="industry-brief-heading"
      >
        <div className="zb-industry-brief-intro">
          <ClipboardList aria-hidden="true" />
          <p className="zb-eyebrow">Prepare your requirement</p>
          <h2 id="industry-brief-heading">
            A useful brief starts with the work.
          </h2>
          <p>{detail.briefDescription}</p>
          <ActionLink href={requirementHref}>Share your requirement</ActionLink>
        </div>
        <dl>
          {detail.briefItems.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.description}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="zb-industry-section">
        <CTASection {...detail.cta} href={requirementHref} />
      </div>
      <div className="zb-industry-back-link">
        <ActionLink href="/industries" variant="text">
          Explore all industries
        </ActionLink>
      </div>
    </div>
  );
}
