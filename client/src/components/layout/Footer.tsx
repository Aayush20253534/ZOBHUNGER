import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  ClipboardList,
  Globe2,
  Handshake,
  LogIn,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";
import "@/styles/footer-business.css";

type FooterLink = { href: string; label: string; icon?: LucideIcon };
type MobileStore = (typeof site.mobileApps)[keyof typeof site.mobileApps];

const businessLinks = [
  { label: "For business", href: "/for-business", icon: Building2 },
  { label: "Hire workforce", href: "/hire-workforce", icon: ClipboardList },
  { label: "Business login", href: "/business/login", icon: LogIn },
  { label: "Verification services", href: "/verification-services", icon: ShieldCheck },
  { label: "Branding & activation", href: "/brand-activation#solution-services", icon: Megaphone },
] as const satisfies readonly FooterLink[];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Presence", href: "/presence" },
  { label: "Brand experience", href: "/brand-experience" },
  { label: "Case studies", href: "/case-studies" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
] as const;

const opportunityLinks = [
  { label: "For workers", href: "/for-workers" },
  { label: "Jobs & opportunities", href: "/jobs" },
  { label: "Create worker account", href: "/worker/register" },
  { label: "Worker sign in", href: "/worker/login" },
  { label: "My profile & CV", href: "/worker/profile" },
  { label: "Submit your CV / profile", href: "/careers/apply" },
  { label: "How it works", href: "/how-it-works" },
] as const;

const partnershipLinks = [
  { label: "Vendor empanelment", href: "/vendor-empanelment" },
  { label: "Independent business partner", href: "/become-a-partner" },
  { label: "Placement cell & institution partnership", href: "/placement-cell-partnership" },
  { label: "Institution partner login", href: "/placement-cell-login" },
] as const;

const resourceLinks = [
  { label: "Blog", href: "/blogs" },
  { label: "Industries we serve", href: "/industries" },
  { label: "Technology vision", href: "/technology" },
] as const;

const footerGroups = [
  { title: "For business", label: "Business links in footer", links: businessLinks },
  { title: "Company", label: "Company links in footer", links: companyLinks },
  {
    title: "Services",
    label: "Services in footer",
    links: [
      { label: "Our services", href: "/solutions" },
      ...solutions.map((solution) => ({
        label: solution.label,
        href: `/${solution.slug}`,
      })),
    ],
  },
  { title: "Opportunities", label: "Opportunity links in footer", links: opportunityLinks },
  { title: "Partnerships", label: "Partnership links in footer", links: partnershipLinks },
  { title: "Resources", label: "Resource links in footer", links: resourceLinks },
] as const;

function GooglePlayMark() {
  return (
    <svg className="zb-footer-store-mark" viewBox="0 0 32 36" aria-hidden="true">
      <path d="M4.4 3.6c-.8.8-1.3 2-1.3 3.5v21.8c0 1.5.5 2.7 1.3 3.5l.2.2 12.2-14.4v-.4L4.6 3.4l-.2.2Z" fill="currentColor" opacity=".9" />
      <path d="m20.9 22.9-4.1-4.9v-.4l4.1-4.8.3.2 5 2.9c1.4.8 1.4 2.1 0 2.9l-5 2.9-.3.2Z" fill="currentColor" />
      <path d="M21.2 22.7 16.8 18 4.4 32.5c1.2 1.1 3 .9 5-.2l11.8-6.8Z" fill="currentColor" opacity=".75" />
      <path d="M21.2 13.3 9.4 6.5c-2-1.1-3.8-1.3-5-.2L16.8 18l4.4-4.7Z" fill="currentColor" opacity=".75" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg className="zb-footer-store-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.7 12.8c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9-.8 0-2-1-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8s2.3-1.2 3.1-2.5c1-1.4 1.4-2.9 1.4-3-.1 0-3-.9-3-4.1ZM16.2 5.6c.7-.9 1.2-2.1 1.1-3.3-1.1.1-2.4.7-3.2 1.6-.7.8-1.3 2-1.2 3.2 1.2.1 2.5-.6 3.3-1.5Z"
      />
    </svg>
  );
}

function StoreBadge({ store, platform }: { store: MobileStore; platform: "android" | "ios" }) {
  const content = (
    <>
      <span className="zb-footer-store-icon" aria-hidden="true">
        {platform === "android" ? <GooglePlayMark /> : <AppleMark />}
      </span>
      <span className="zb-footer-store-copy">
        <small>{store.statusLabel}</small>
        <strong>{store.label}</strong>
      </span>
      {store.href && <ArrowUpRight className="zb-footer-store-arrow" aria-hidden="true" />}
    </>
  );

  if (store.href) {
    return (
      <a className="zb-footer-store-badge" href={store.href} target="_blank" rel="noreferrer" aria-label={`${store.label} download page`}>
        {content}
      </a>
    );
  }

  return (
    <span className="zb-footer-store-badge" data-coming-soon="true" aria-label={`${store.label}, ${store.statusLabel}`}>
      {content}
    </span>
  );
}

function FooterLinks({ links }: { links: readonly FooterLink[] }) {
  return (
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href}>
            {link.icon && <link.icon className="zb-footer-link-icon" aria-hidden="true" />}
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FooterLinkGroup({ group }: { group: (typeof footerGroups)[number] }) {
  return (
    <>
      <nav className={`zb-footer-desktop-group${group.title === "For business" ? " zb-footer-business-group" : ""}`} aria-label={group.label}>
        <h2>{group.title}</h2>
        <FooterLinks links={group.links} />
      </nav>
      <details className={`zb-footer-mobile-group${group.title === "For business" ? " zb-footer-business-group" : ""}`} open={group.title === "For business"}>
        <summary>
          <h2>
            {group.title}
            <ChevronDown aria-hidden="true" />
          </h2>
        </summary>
        <nav aria-label={group.label}>
          <FooterLinks links={group.links} />
        </nav>
      </details>
    </>
  );
}

export function Footer() {
  const contact = site.publicContact;

  return (
    <footer className="zb-footer">
      <div className="zb-container">
        <div className="zb-footer-grid">
          <div className="zb-footer-intro">
            <div className="zb-footer-intro-copy">
              <Link href="/" className="zb-wordmark" aria-label="ZOBHUNGER home">
                ZOB<span>HUNGER</span>
              </Link>
              <p>{site.description}</p>
              <div className="zb-footer-global" aria-label={site.globalReach.label}>
                <Globe2 aria-hidden="true" />
                <span>{site.globalReach.label}</span>
              </div>
            </div>
            <ActionLink href={site.primaryAction.href} variant="light">
              Tell us what you need
            </ActionLink>
          </div>

          <div className="zb-footer-utility">
            <section className="zb-footer-app" aria-labelledby="zb-footer-app-title">
              <div className="zb-footer-app-copy">
                <span className="zb-footer-eyebrow">ZOBHUNGER mobile app</span>
                <h2 id="zb-footer-app-title">Mobile access is coming soon.</h2>
                <p>Our app is being prepared for Google Play and the Apple App Store. Download links will activate here when the app is published.</p>
              </div>
              <div className="zb-footer-store-list" aria-label="Mobile application availability">
                <StoreBadge store={site.mobileApps.android} platform="android" />
                <StoreBadge store={site.mobileApps.ios} platform="ios" />
              </div>
            </section>

            <section className="zb-footer-contact" aria-labelledby="zb-footer-contact-title">
              <span className="zb-footer-eyebrow">Connect with us</span>
              <h2 id="zb-footer-contact-title">Talk to the ZOBHUNGER team.</h2>
              <div className="zb-footer-contact-list">
                <a href={`mailto:${contact.email}`}>
                  <Mail aria-hidden="true" />
                  <span>
                    <small>Email</small>
                    <strong>{contact.email}</strong>
                  </span>
                </a>
                <a href={contact.phoneHref}>
                  <Phone aria-hidden="true" />
                  <span>
                    <small>Phone</small>
                    <strong>{contact.phoneLabel}</strong>
                  </span>
                </a>
                <a href={contact.mapsHref} target="_blank" rel="noreferrer">
                  <MapPin aria-hidden="true" />
                  <span>
                    <small>Office</small>
                    <strong>{contact.address}</strong>
                  </span>
                  <ArrowUpRight className="zb-footer-contact-arrow" aria-hidden="true" />
                </a>
              </div>
            </section>
          </div>

          {footerGroups.map((group) => <FooterLinkGroup key={group.title} group={group} />)}
        </div>

        <div className="zb-footer-bottom">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
