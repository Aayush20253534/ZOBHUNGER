import {
  ArrowUpRight,
  Building2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { site } from "@/data/site";
import { ContactForm } from "@/components/forms/ContactForm";
import "@/styles/company.css";

const publicContact = site.publicContact;

export function ContactPageContent({
  serviceRequired,
}: {
  serviceRequired: string;
}) {
  const isDigitalProject = serviceRequired === "website-application-development";

  return (
    <div className="zb-company zb-company-form-page">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <PageShell
        eyebrow="Contact ZOBHUNGER"
        title="Let's talk about the work ahead."
        description={isDigitalProject ? "Planning a website, web platform or mobile application? Share the users, features and business outcome you have in mind." : "Have a question about staffing, sales teams or business execution? Tell us the service you are exploring and what you want to discuss."}
      />

      <div className="zb-company-form-layout">
        <div className="zb-company-form-main">
          <section
            className="zb-company-form-panel"
            aria-labelledby="contact-form-title"
          >
            <h2 id="contact-form-title">Make an enquiry</h2>
            <ContactForm key={serviceRequired} initialService={serviceRequired} />
          </section>

          <section
            className="zb-contact-office-card"
            aria-labelledby="contact-office-title"
          >
            <div className="zb-contact-office-heading">
              <span className="zb-contact-office-mark" aria-hidden="true">
                <Building2 />
              </span>
              <div>
                <span className="zb-eyebrow">Business contact</span>
                <h2 id="contact-office-title">Reach ZOBHUNGER directly.</h2>
                <p>
                  For formal correspondence, business enquiries or an office
                  reference, use the details below.
                </p>
              </div>
            </div>

            <div className="zb-contact-office-details">
              <article className="zb-contact-office-detail zb-contact-office-detail--address">
                <span className="zb-contact-office-detail-icon" aria-hidden="true">
                  <MapPin />
                </span>
                <div>
                  <small>Head office</small>
                  <strong>{publicContact.address}</strong>
                  <a
                    href={publicContact.mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open head office in Google Maps (opens in a new tab)"
                  >
                    Open in Maps
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
              </article>

              <article className="zb-contact-office-detail">
                <span className="zb-contact-office-detail-icon" aria-hidden="true">
                  <Mail />
                </span>
                <div>
                  <small>Email</small>
                  <a href={publicContact.emailHref}>
                    {publicContact.email}
                  </a>
                </div>
              </article>

              <article className="zb-contact-office-detail">
                <span className="zb-contact-office-detail-icon" aria-hidden="true">
                  <Phone />
                </span>
                <div>
                  <small>Phone</small>
                  <a href={publicContact.phoneHref}>{publicContact.phoneLabel}</a>
                </div>
              </article>
            </div>
          </section>
        </div>

        <aside
          className="zb-company-form-aside"
          aria-label="Other ways to get started"
        >
          {isDigitalProject ? (
            <section className="zb-company-aside-card zb-company-aside-soft">
              <span className="zb-eyebrow">Digital project brief</span>
              <h2>What should you include?</h2>
              <p>
                Tell us what you want to build, who will use it, the main
                features, any existing system it should connect with and your
                preferred timeline.
              </p>
              <ActionLink href="#contact-form-title">
                Share your project
              </ActionLink>
            </section>
          ) : (
            <section className="zb-company-aside-card zb-company-aside-soft">
              <span className="zb-eyebrow">For your business</span>
              <h2>Already have a requirement?</h2>
              <p>
                Use the detailed form to share your team size, locations,
                timeline and responsibilities.
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
          )}

          <section className="zb-company-aside-card">
            <span className="zb-eyebrow">Independent business partners</span>
            <h2>Want to collaborate through your expertise or network?</h2>
            <p>
              Explore the Independent Business Partner Program for flexible,
              contribution-led project opportunities.
            </p>
            <ActionLink href="/become-a-partner" variant="secondary">
              Partner With Us
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
        </aside>
      </div>
    </div>
  );
}
