import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  MapPin,
  Navigation,
  Route,
  UsersRound,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/presence.css";

export const metadata = getPageMetadata(
  "Our Presence",
  "Explore ZOBHUNGER's headquarters and growing operating presence across key Indian markets.",
  "/presence",
);

const locations = [
  {
    label: "Headquarters",
    title: "Ghazipur, Uttar Pradesh",
    shortLabel: "HQ",
    description:
      "The central coordination point for workforce deployment, field execution and business support.",
    className: "zb-presence-location-card--hq",
  },
  {
    label: "Branch presence",
    title: "Delhi",
    shortLabel: "North",
    description:
      "Supporting requirements across an important northern business and workforce market.",
    className: "",
  },
  {
    label: "Branch presence",
    title: "Mumbai, Maharashtra",
    shortLabel: "West",
    description:
      "Extending ZOBHUNGER's execution capability into one of India's largest commercial markets.",
    className: "",
  },
  {
    label: "Branch presence",
    title: "Bihar",
    shortLabel: "East",
    description:
      "Strengthening regional workforce and field execution support across eastern markets.",
    className: "",
  },
  {
    label: "Branch presence",
    title: "Bengaluru, Karnataka",
    shortLabel: "South",
    description:
      "Supporting workforce, sales and execution requirements across a key southern business market.",
    className: "",
  },
] as const;

const executionSteps = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Requirement mapping",
    description:
      "We begin with the role, location, timeline and execution outcome your business needs.",
  },
  {
    number: "02",
    icon: UsersRound,
    title: "Regional coordination",
    description:
      "The requirement is aligned with the relevant operating market and field team structure.",
  },
  {
    number: "03",
    icon: Route,
    title: "On-ground execution",
    description:
      "Teams are deployed against the agreed scope, with coordination continuing through delivery.",
  },
] as const;

export default function PresencePage() {
  return (
    <div className="zb-presence-page">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Presence" }]}
      />

      <section className="zb-presence-hero">
        <div className="zb-presence-hero-copy">
          <PageShell
            eyebrow="Our presence"
            title="Closer to the markets where execution happens."
            description="ZOBHUNGER is building a focused operating footprint across key Indian markets, anchored by our headquarters in Ghazipur, Uttar Pradesh."
            actions={
              <>
                <ActionLink href="/hire-workforce">Hire workforce</ActionLink>
                <ActionLink href="/contact" variant="secondary">
                  Talk to our team
                </ActionLink>
              </>
            }
          />
        </div>

        <aside
          className="zb-presence-network"
          aria-label="ZOBHUNGER operating footprint"
        >
          <div className="zb-presence-network-header">
            <div>
              <span className="zb-eyebrow">Operating footprint</span>
              <h2>One coordinated network, built around execution.</h2>
            </div>
            <div className="zb-presence-network-status">
              <span className="zb-presence-network-icon" aria-hidden="true">
                <Navigation />
              </span>

              <div className="zb-presence-network-status-copy">
                <small>Execution network</small>

                <span className="zb-presence-network-status-value">
                  <strong>5</strong>
                  <span>coordination points</span>
                </span>
              </div>
            </div>
          </div>

          <div className="zb-presence-network-canvas" aria-hidden="true">
            <span className="zb-presence-network-halo zb-presence-network-halo--outer" />
            <span className="zb-presence-network-halo zb-presence-network-halo--inner" />
            <span className="zb-presence-network-line zb-presence-network-line--north" />
            <span className="zb-presence-network-line zb-presence-network-line--west" />
            <span className="zb-presence-network-line zb-presence-network-line--east" />
            <span className="zb-presence-network-line zb-presence-network-line--south" />

            <span className="zb-presence-network-node zb-presence-network-node--hq">
              <span className="zb-presence-network-node-icon">
                <Building2 />
              </span>
              <span className="zb-presence-network-node-copy">
                <small>Coordination hub</small>
                <strong>Ghazipur</strong>
                <em>Headquarters</em>
              </span>
              <b>HQ</b>
            </span>
            <span className="zb-presence-network-node zb-presence-network-node--delhi">
              <span className="zb-presence-network-node-icon">
                <MapPin />
              </span>
              <span className="zb-presence-network-node-copy">
                <small>North market</small>
                <strong>Delhi</strong>
              </span>
              <b>DEL</b>
            </span>
            <span className="zb-presence-network-node zb-presence-network-node--mumbai">
              <span className="zb-presence-network-node-icon">
                <MapPin />
              </span>
              <span className="zb-presence-network-node-copy">
                <small>West market</small>
                <strong>Mumbai</strong>
              </span>
              <b>MUM</b>
            </span>
            <span className="zb-presence-network-node zb-presence-network-node--bihar">
              <span className="zb-presence-network-node-icon">
                <MapPin />
              </span>
              <span className="zb-presence-network-node-copy">
                <small>East market</small>
                <strong>Bihar</strong>
              </span>
              <b>BIH</b>
            </span>
            <span className="zb-presence-network-node zb-presence-network-node--bengaluru">
              <span className="zb-presence-network-node-icon">
                <MapPin />
              </span>
              <span className="zb-presence-network-node-copy">
                <small>South market</small>
                <strong>Bengaluru</strong>
              </span>
              <b>BLR</b>
            </span>
          </div>

          <div className="zb-presence-network-footer">
            <span>
              <i data-tone="hq" /> Headquarters
            </span>
            <span>
              <i data-tone="market" /> Branch / market presence
            </span>
            <small>Workforce + field execution coordination</small>
          </div>
        </aside>
      </section>

      <section
        className="zb-section zb-presence-locations"
        aria-labelledby="presence-locations-title"
      >
        <div className="zb-section-heading">
          <div>
            <span className="zb-eyebrow">Where we operate</span>
            <h2 id="presence-locations-title">
              A growing footprint across priority markets.
            </h2>
            <p>
              Our location structure is designed to keep coordination close to
              the businesses, workers and field activities we support.
            </p>
          </div>
        </div>

        <div className="zb-presence-location-grid">
          {locations.map((location) => (
            <article
              className={`zb-presence-location-card ${location.className}`.trim()}
              key={location.title}
            >
              <div className="zb-presence-location-card-top">
                <span className="zb-presence-location-index">
                  {location.shortLabel}
                </span>
                <MapPin aria-hidden="true" />
              </div>
              <span className="zb-presence-location-type">
                {location.label}
              </span>
              <h3>{location.title}</h3>
              <p>{location.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="zb-section zb-presence-execution"
        aria-labelledby="presence-execution-title"
      >
        <div className="zb-section-heading">
          <div>
            <span className="zb-eyebrow">From presence to execution</span>
            <h2 id="presence-execution-title">
              A location matters only when it helps work move faster.
            </h2>
            <p>
              ZOBHUNGER connects business requirements with regional
              coordination and practical on-ground execution, rather than
              treating presence as a list of addresses.
            </p>
          </div>
        </div>

        <div className="zb-presence-step-grid">
          {executionSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article className="zb-presence-step" key={step.number}>
                <div className="zb-presence-step-top">
                  <span>{step.number}</span>
                  <Icon aria-hidden="true" />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="zb-section zb-presence-route-panel"
        aria-labelledby="presence-route-title"
      >
        <div className="zb-presence-route-copy">
          <span className="zb-eyebrow">Built around your requirement</span>
          <h2 id="presence-route-title">
            Execution should follow the work, not office boundaries.
          </h2>
          <p>
            Share the market, workforce requirement and objective. Our team can
            map the appropriate coordination path and help structure the
            execution plan.
          </p>
          <ActionLink href="/contact" variant="light">
            Discuss your market requirement <ArrowRight aria-hidden="true" />
          </ActionLink>
        </div>

        <div
          className="zb-presence-route-flow"
          aria-label="ZOBHUNGER execution flow"
        >
          <span>Business requirement</span>
          <ArrowRight aria-hidden="true" />
          <span>Regional coordination</span>
          <ArrowRight aria-hidden="true" />
          <span>Field deployment</span>
          <ArrowRight aria-hidden="true" />
          <span>Execution & reporting</span>
        </div>
      </section>

      <div className="zb-presence-final-cta">
        <CTASection
          title="Need workforce or field execution in your market?"
          description="Tell us the location, role and scope. We will help you structure the requirement and next steps."
          href="/hire-workforce"
          label="Share your requirement"
        />
      </div>
    </div>
  );
}
