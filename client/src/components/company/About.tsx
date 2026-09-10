import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Compass,
  MapPin,
  Target,
} from "lucide-react";

import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SectionHeading } from "@/components/common/SectionHeading";
import { WorkplacePhoto } from "@/components/common/WorkplacePhoto";

import { company } from "@/data/company";
import { market, operatingLocations } from "@/data/market";
import {
  brandStrengths,
  coreCapabilities,
} from "@/data/core-capabilities";
import { site } from "@/data/site";

import "@/styles/company.css";

const executionModel = [
  "Requirement",
  "Planning",
  "Workforce",
  "Deployment",
  "Execution",
  "Measurement",
] as const;

const capabilityLinks = [
  "/workforce-solutions",
  "/retail-execution",
  "/brand-activation",
  "/sales-force",
  "/brand-activation",
  "/business-operations",
] as const;


export function About() {
  return (
    <div className="zb-company zb-about-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "About" },
        ]}
      />

      {/* HERO */}
      <section
        className="zb-about-hero-new"
        aria-labelledby="about-title"
      >
        <div className="zb-about-hero-copy">
          <span className="zb-eyebrow">About ZOBHUNGER</span>

          <h1 id="about-title">
            Built for workforce.{" "}
            <span>Designed for execution.</span>
          </h1>

          <p>
            ZOBHUNGER helps businesses build, deploy and coordinate
            teams across workforce, sales, retail, activation and
            business operations.
          </p>

          <div className="zb-about-hero-actions">
            <ActionLink href="/solutions">
              Explore services
              <ArrowUpRight aria-hidden="true" />
            </ActionLink>

            <ActionLink
              href="/presence"
              variant="secondary"
            >
              Our presence
            </ActionLink>
          </div>
        </div>

        <aside
          className="zb-about-hero-panel"
          aria-label="ZOBHUNGER operating idea"
        >
          <span className="zb-eyebrow">
            Our operating idea
          </span>

          <strong>{site.tagline}</strong>

          <p>
            Start with the requirement, build the right team and
            keep execution connected to the work the business
            needs completed.
          </p>

          <div
            className="zb-about-hero-track"
            aria-hidden="true"
          >
            <span>People</span>
            <i />

            <span>Market</span>
            <i />

            <span>Execution</span>
          </div>
        </aside>
      </section>

      {/* WHO WE ARE */}
      <section
        className="zb-company-section zb-about-intro"
        aria-labelledby="about-who-title"
      >
        <div>
          <span className="zb-eyebrow">Who we are</span>

          <h2 id="about-who-title">
            A workforce and business execution partner.
          </h2>
        </div>

        <div className="zb-about-intro-copy">
          <p>{company.description}</p>

          <p>
            The role is only one part of the assignment. We
            connect people with deployment, coordination and
            on-ground activity so businesses can plan around the
            outcome they need, not just the vacancy they need
            filled.
          </p>

          <p>
            We serve clients {market.clientReach.scope} while our current execution
            footprint remains anchored in {market.primaryMarket.name} and continues to
            grow across priority locations.
          </p>

          <ul aria-label="ZOBHUNGER focus areas">
            <li>Workforce</li>
            <li>Sales</li>
            <li>Retail</li>
            <li>Field operations</li>
            <li>Brand activation</li>
            <li>Business operations</li>
          </ul>
        </div>
      </section>

      <section className="zb-company-section" aria-label="ZOBHUNGER workforce in context">
        <WorkplacePhoto />
      </section>

      {/* EXECUTION MODEL */}
      <section
        className="zb-company-section zb-about-execution"
        aria-labelledby="about-execution-title"
      >
        <SectionHeading
          id="about-execution-title"
          eyebrow="Our execution model"
          title="One connected path from brief to measurable work."
          description="The operating model keeps workforce decisions connected to deployment and delivery instead of treating hiring as the finish line."
        />

        <ol className="zb-about-execution-track">
          {executionModel.map((step, index) => (
            <li key={step}>
              <span>
                {String(index + 1).padStart(2, "0")}
              </span>

              <strong>{step}</strong>

              {index < executionModel.length - 1 ? (
                <ArrowRight aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* MISSION + VISION */}
      <section
        className="zb-company-section zb-about-purpose-grid"
        aria-label="Mission and vision"
      >
        <article className="zb-about-purpose-card">
          <Target aria-hidden="true" />

          <span className="zb-eyebrow">
            Our mission
          </span>

          <h2>{company.mission}</h2>

          <p>
            Make it easier for businesses to move from a
            requirement to a team that is ready to perform the
            work.
          </p>
        </article>

        <article className="zb-about-purpose-card zb-about-purpose-card--dark">
          <Compass aria-hidden="true" />

          <span className="zb-eyebrow">
            Our vision
          </span>

          <h2>{company.vision}</h2>

          <p>
            Connect businesses, people and execution through a
            clearer, more coordinated operating ecosystem.
          </p>
        </article>
      </section>

      {/* CORE CAPABILITIES */}
      <section
        className="zb-company-section"
        aria-labelledby="about-capabilities-title"
      >
        <SectionHeading
          id="about-capabilities-title"
          eyebrow="Core capabilities"
          title="Capabilities built around on-ground delivery."
          description="A connected mix of manpower, field execution, acquisition, activation and operational support."
          action={
            <ActionLink
              href="/solutions"
              variant="text"
            >
              Explore all services
            </ActionLink>
          }
        />

        <div className="zb-about-capability-grid">
          {coreCapabilities.map((capability, index) => {
            const href =
              capabilityLinks[index] ?? "/solutions";

            return (
              <Link
                href={href}
                key={capability.id}
              >
                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3>{capability.title}</h3>

                <p>{capability.description}</p>

                <ArrowUpRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* PRESENCE */}
      <section
        className="zb-company-section zb-about-presence"
        aria-labelledby="about-presence-title"
      >
        <div className="zb-about-presence-copy">
          <span className="zb-eyebrow">
            Our presence
          </span>

          <h2 id="about-presence-title">
            Execution stays closer to the market.
          </h2>

          <p>
            ZOBHUNGER operates from {operatingLocations.find((location) => location.type === "headquarters")?.title}, with
            a growing presence across priority {market.primaryMarket.adjective} markets.
            Client relationships can extend {market.clientReach.scope} while
            operating coverage expands market by market.
          </p>

          <ActionLink
            href="/presence"
            variant="secondary"
          >
            Explore our presence
            <ArrowUpRight aria-hidden="true" />
          </ActionLink>
        </div>

        <div className="zb-about-presence-grid">
          {operatingLocations.map((location) => {
            const Icon = location.type === "headquarters" ? Building2 : MapPin;

            return (
              <article key={location.id}>
                <Icon aria-hidden="true" />

                <small>{location.label}</small>

                <strong>{location.title}</strong>
              </article>
            );
          })}
        </div>
      </section>

      {/* WHY ZOBHUNGER */}
      <section
        className="zb-company-section zb-about-why"
        aria-labelledby="about-why-title"
      >
        <div className="zb-about-why-copy">
          <span className="zb-eyebrow">
            Why ZOBHUNGER
          </span>

          <h2 id="about-why-title">
            Built around execution, not disconnected
            hand-offs.
          </h2>

          <p>
            The aim is simple: make it easier to coordinate the
            people, market activity and reporting needed around
            a business requirement.
          </p>
        </div>

        <ul>
          {brandStrengths.map((strength, index) => (
            <li key={strength}>
              <span>
                {String(index + 1).padStart(2, "0")}
              </span>

              <CheckCircle2 aria-hidden="true" />

              <strong>{strength}</strong>
            </li>
          ))}
        </ul>
      </section>

      {/* FINAL CTA */}
      <section
        className="zb-company-section zb-about-final-panel"
        aria-labelledby="about-final-title"
      >
        <div>
          <span className="zb-eyebrow">
            Build with ZOBHUNGER
          </span>

          <h2 id="about-final-title">
            Build your next execution team with us.
          </h2>

          <p>
            Looking for workforce support, or considering a
            career inside ZOBHUNGER? Start with the route that
            fits what you need.
          </p>
        </div>

        <div>
          <ActionLink
            href="/hire-workforce"
            variant="light"
          >
            Hire workforce
          </ActionLink>

          <ActionLink
            href="/careers"
            variant="secondary"
          >
            Explore careers
          </ActionLink>
        </div>
      </section>
    </div>
  );
}