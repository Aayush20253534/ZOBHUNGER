import {
  ArrowUpRight,
  Check,
  LayoutDashboard,
  PanelsTopLeft,
  Smartphone,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/card";
import { technologyPortals } from "@/data/company";
import "@/styles/company.css";

const icons = {
  client: LayoutDashboard,
  worker: Smartphone,
  admin: PanelsTopLeft,
};

export function Technology() {
  return (
    <div className="zb-company">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Technology" }]}
      />
      <div className="zb-company-hero">
        <PageShell
          eyebrow="Our technology vision"
          title="Technology that helps businesses manage better."
          description="We're building toward connected tools for business teams, workers and the people coordinating delivery. One place to understand the requirement, the assignment and the progress."
          actions={
            <ActionLink href="/contact">
              Discuss your workflow{" "}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </ActionLink>
          }
        />
        <aside
          className="zb-company-statement"
          aria-labelledby="technology-status-title"
        >
          <span className="zb-eyebrow">Product direction</span>
          <h2 id="technology-status-title">Connected portals are planned.</h2>
          <span>
            The features below describe future releases. Client accounts, worker
            accounts and internal dashboards are not available on this website
            yet.
          </span>
        </aside>
      </div>
      <section
        className="zb-company-section"
        aria-labelledby="technology-portals-title"
      >
        <SectionHeading
          id="technology-portals-title"
          eyebrow="Three connected workspaces"
          title="Designed around the people using them."
        />
        <div className="zb-company-grid" data-columns="3">
          {technologyPortals.map((portal) => {
            const Icon = icons[portal.id];
            return (
              <Card key={portal.id} className="zb-card zb-technology-card">
                <div className="zb-card-top">
                  <Icon className="zb-card-icon" aria-hidden="true" />
                  <span className="zb-chip">Planned</span>
                </div>
                <span className="zb-technology-audience">
                  {portal.audience}
                </span>
                <h3 className="zb-card-title">{portal.title}</h3>
                <p className="zb-card-copy">{portal.description}</p>
                <ul>
                  {portal.features.map((feature) => (
                    <li key={feature}>
                      <Check aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>
      <section
        className="zb-company-section zb-company-note"
        aria-labelledby="technology-requirement-title"
      >
        <div>
          <h2 id="technology-requirement-title">
            Your workflow starts with the brief.
          </h2>
          <p>
            Tell us which roles, work updates and reports matter to your
            operation. Those details help define the requirement and the tools
            it may need.
          </p>
        </div>
        <ActionLink href="/hire-workforce" variant="secondary">
          Share a requirement
        </ActionLink>
      </section>
      <div className="zb-company-section">
        <CTASection
          title="Have a workflow you want us to understand?"
          description="Share the work you manage today and the information your team needs to see."
          href="/contact"
          label="Talk about your workflow"
        />
      </div>
    </div>
  );
}
