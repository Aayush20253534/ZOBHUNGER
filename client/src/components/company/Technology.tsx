import {
  ArrowUpRight,
  Check,
  GraduationCap,
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
  institution: GraduationCap,
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
          eyebrow="Connected technology"
          title="One platform for workforce and business execution."
          description="ZOBHUNGER connects approved business teams, workers, institution partners and internal operations through role-based workspaces. Requirements, people, assignments and progress stay connected to the same operating flow."
          actions={
            <>
              <ActionLink href="/contact">
                Discuss your workflow{" "}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </ActionLink>
              <ActionLink href="/login" variant="secondary">
                Portal access
              </ActionLink>
            </>
          }
        />
        <aside
          className="zb-company-statement"
          aria-labelledby="technology-status-title"
        >
          <span className="zb-eyebrow">Platform status</span>
          <h2 id="technology-status-title">Role-based workspaces are available now.</h2>
          <span>
            Business, worker, institution and operations access is already part
            of the platform. Each workspace exposes only the tools relevant to
            that authorised account.
          </span>
        </aside>
      </div>
      <section
        className="zb-company-section"
        aria-labelledby="technology-portals-title"
      >
        <SectionHeading
          id="technology-portals-title"
          eyebrow="Four connected workspaces"
          title="Designed around the people using them."
          description="Each audience gets a focused workspace while the underlying workflow stays connected across hiring, deployment and execution."
        />
        <div className="zb-company-grid" data-columns="2">
          {technologyPortals.map((portal) => {
            const Icon = icons[portal.id];
            return (
              <Card key={portal.id} className="zb-card zb-technology-card">
                <div className="zb-card-top">
                  <Icon className="zb-card-icon" aria-hidden="true" />
                  <span className="zb-chip">Available</span>
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
            The technology follows the work, not the other way around.
          </h2>
          <p>
            Start with the roles, locations, approvals and reporting your
            operation actually needs. The connected workspaces then keep those
            responsibilities visible to the right people.
          </p>
        </div>
        <ActionLink href="/hire-workforce" variant="secondary">
          Share a requirement
        </ActionLink>
      </section>
      <div className="zb-company-section">
        <CTASection
          title="Need workforce or execution support?"
          description="Share the requirement, locations and operating details. We’ll help connect the right service and workflow around it."
          href="/hire-workforce"
          label="Hire Workforce"
        />
      </div>
    </div>
  );
}
