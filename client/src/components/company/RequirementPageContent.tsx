import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { RequirementForm } from "@/components/forms/RequirementForm";
import { briefChecklist } from "@/data/company";
import "@/styles/company.css";

export function RequirementPageContent({
  industry,
  serviceRequired,
}: {
  industry: string;
  serviceRequired: string;
}) {
  return (
    <div className="zb-company zb-company-form-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "For Business", href: "/for-business" },
          { label: "Hire Workforce" },
        ]}
      />
      <PageShell
        eyebrow="Hire workforce"
        title="Tell us what your business needs."
        description="Share the roles, locations and work you have in mind. Start with your main service, then add the details that will help shape the assignment."
      />
      <div className="zb-company-form-layout">
        <section
          className="zb-company-form-panel"
          aria-labelledby="requirement-form-title"
        >
          <h2 id="requirement-form-title">Your requirement</h2>
          <RequirementForm
            key={industry + ":" + serviceRequired}
            initialIndustry={industry}
            initialService={serviceRequired}
          />
        </section>
        <aside
          className="zb-company-form-aside"
          aria-label="Requirement guidance"
        >
          <section className="zb-company-aside-card">
            <span className="zb-eyebrow">A useful brief</span>
            <h2>Help us understand the assignment.</h2>
            <dl>
              {briefChecklist.map((item) => (
                <div key={item.title}>
                  <dt>{item.title}</dt>
                  <dd>{item.description}</dd>
                </div>
              ))}
            </dl>
            <ActionLink href="/how-it-works" variant="text">
              How the process works
            </ActionLink>
          </section>
          <section className="zb-company-aside-card zb-company-aside-soft">
            <h2>Still deciding what you need?</h2>
            <p>
              Explore the services or send a shorter enquiry with the questions
              you want to discuss.
            </p>
            <ActionLink
              href={
                serviceRequired
                  ? "/contact?service=" + encodeURIComponent(serviceRequired)
                  : "/contact"
              }
              variant="secondary"
            >
              Make an enquiry
            </ActionLink>
          </section>
        </aside>
      </div>
    </div>
  );
}
