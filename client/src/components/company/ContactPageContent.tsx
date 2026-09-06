import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { ContactForm } from "@/components/forms/ContactForm";
import { contactDetails } from "@/data/contact";
import "@/styles/company.css";

export function ContactPageContent({
  serviceRequired,
}: {
  serviceRequired: string;
}) {
  const hasBusinessContacts = Boolean(
    contactDetails.businessEmail ||
      contactDetails.phone ||
      contactDetails.officeAddress ||
      contactDetails.socialLinks?.length,
  );
  return (
    <div className="zb-company zb-company-form-page">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <PageShell
        eyebrow="Contact ZOBHUNGER"
        title="Let's talk about the work ahead."
        description="Have a question about staffing, sales teams or business execution? Tell us the service you are exploring and what you want to discuss."
      />
      <div className="zb-company-form-layout">
        <section
          className="zb-company-form-panel"
          aria-labelledby="contact-form-title"
        >
          <h2 id="contact-form-title">Make an enquiry</h2>
          <ContactForm key={serviceRequired} initialService={serviceRequired} />
        </section>
        <aside
          className="zb-company-form-aside"
          aria-label="Other ways to get started"
        >
          <section className="zb-company-aside-card zb-company-aside-soft">
            <span className="zb-eyebrow">For your business</span>
            <h2>Already have a requirement?</h2>
            <p>
              Use the detailed form to share your team size, locations, timeline
              and responsibilities.
            </p>
            <ActionLink
              href={
                serviceRequired
                  ? "/hire-workforce?service=" +
                    encodeURIComponent(serviceRequired)
                  : "/hire-workforce"
              }
            >
              Hire workforce
            </ActionLink>
          </section>
          <section className="zb-company-aside-card">
            <span className="zb-eyebrow">For workers</span>
            <h2>Looking for your next role?</h2>
            <p>
              Start with the worker page to explore the kinds of work ZOBHUNGER
              is building around.
            </p>
            <ActionLink href="/for-workers" variant="secondary">
              Explore work opportunities
            </ActionLink>
          </section>
          {hasBusinessContacts && (
            <section className="zb-company-aside-card">
              <h2>Business contact details</h2>
              <dl className="zb-business-contacts">
                {contactDetails.businessEmail && (
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={"mailto:" + contactDetails.businessEmail}>
                        {contactDetails.businessEmail}
                      </a>
                    </dd>
                  </div>
                )}
                {contactDetails.phone && (
                  <div>
                    <dt>Phone</dt>
                    <dd>
                      <a href={contactDetails.phone.href}>
                        {contactDetails.phone.label}
                      </a>
                    </dd>
                  </div>
                )}
                {contactDetails.officeAddress && (
                  <div>
                    <dt>Office</dt>
                    <dd>
                      <address>{contactDetails.officeAddress}</address>
                    </dd>
                  </div>
                )}
              </dl>
              {Boolean(contactDetails.socialLinks?.length) && (
                <ul className="zb-contact-socials">
                  {contactDetails.socialLinks?.map((link) => (
                    <li key={link.href}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
