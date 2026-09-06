import Link from "next/link";
import { ArrowUpRight, Compass, Target } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/card";
import { company } from "@/data/company";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";
import "@/styles/company.css";

export function About() {
  return (
    <div className="zb-company">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <div className="zb-company-hero">
        <PageShell
          eyebrow="About ZOBHUNGER"
          title="Building a smarter workforce ecosystem."
          description={company.description}
          actions={
            <ActionLink href="/for-business">
              Work with ZOBHUNGER{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </ActionLink>
          }
        />
        <aside className="zb-company-statement" aria-label="Our approach">
          <span className="zb-eyebrow">People and execution, connected</span>
          <p>{site.tagline}</p>
          <span>
            One approach across workforce, sales and business operations.
          </span>
        </aside>
      </div>
      <section
        className="zb-company-section zb-company-grid"
        data-columns="2"
        aria-label="Mission and vision"
      >
        <Card className="zb-card zb-company-purpose">
          <Target className="zb-card-icon" aria-hidden="true" />
          <h2>Our mission</h2>
          <p>{company.mission}</p>
        </Card>
        <Card className="zb-card zb-company-purpose">
          <Compass className="zb-card-icon" aria-hidden="true" />
          <h2>Our vision</h2>
          <p>{company.vision}</p>
        </Card>
      </section>
      <section
        className="zb-company-section"
        aria-labelledby="about-approach-title"
      >
        <SectionHeading
          id="about-approach-title"
          eyebrow="The way we approach the work"
          title="Built around the assignment."
          description="The role is one part of a bigger operating plan. We bring the requirement, the people and the work into focus together."
        />
        <div className="zb-company-grid" data-columns="3">
          {company.principles.map((item, index) => (
            <article className="zb-company-principle" key={item.title}>
              <span className="zb-company-index" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="zb-company-section"
        aria-labelledby="about-solutions-title"
      >
        <SectionHeading
          id="about-solutions-title"
          eyebrow="One connected offering"
          title="Seven services. A shared purpose."
          description="Support for the people you need and the work your business needs to get done."
        />
        <div className="zb-company-service-links">
          {solutions.map((solution) => (
            <Link key={solution.slug} href={"/" + solution.slug}>
              {solution.label}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <section
        className="zb-company-section zb-company-note"
        aria-labelledby="about-technology-title"
      >
        <div>
          <h2 id="about-technology-title">
            Building toward a connected platform.
          </h2>
          <p>
            Dedicated client, worker and internal operations tools are part of
            our product direction. Explore what is planned for future releases.
          </p>
        </div>
        <ActionLink href="/technology" variant="secondary">
          Our technology vision
        </ActionLink>
      </section>
      <div className="zb-company-section">
        <CTASection
          title="Let's start with your business."
          description="Tell us where you need people, execution or operational support."
        />
      </div>
    </div>
  );
}
