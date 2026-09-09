import Link from "next/link";
import { Building2, ChevronDown, ClipboardList, LogIn, Handshake, ShieldCheck, Megaphone, type LucideIcon } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";
import "@/styles/footer-business.css";

type FooterLink = { href: string; label: string; icon?: LucideIcon };
const businessLinks = [
  { label: "For business", href: "/for-business", icon: Building2 },
  { label: "Vendor empanelment", href: "/vendor-empanelment", icon: Handshake },
  { label: "Become a Partner", href: "/become-a-partner#partner-application", icon: Handshake },
  { label: "Business login", href: "/business/login", icon: LogIn },
  { label: "Hire workforce", href: "/hire-workforce", icon: ClipboardList },
  { label: "Verification services", href: "/verification-services", icon: ShieldCheck },
  { label: "Branding & activation", href: "/brand-activation#solution-services", icon: Megaphone },
] as const satisfies readonly FooterLink[];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Presence", href: "/presence" },
  { label: "Careers", href: "/careers" },
  { label: "Brand experience", href: "/brand-experience" },
  { label: "Case studies", href: "/case-studies" },
  { label: "Contact", href: "/contact" },
] as const;

const opportunityLinks = [
  { label: "For workers", href: "/for-workers" },
  { label: "Create worker account", href: "/worker/register" },
  { label: "Worker sign in", href: "/worker/login" },
  { label: "My profile & CV", href: "/worker/profile" },
  { label: "Jobs & opportunities", href: "/jobs" },
  { label: "Submit your CV / profile", href: "/careers/apply" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Portal access", href: "/login" },
] as const;

const partnershipLinks = [
  { label: "Vendor Empanelment / Onboarding", href: "/vendor-empanelment" },
  { label: "Independent Business Partner", href: "/become-a-partner" },
  {
    label: "Placement Cell & Institution Partnership",
    href: "/placement-cell-partnership",
  },
  { label: "Institution Partner Login", href: "/placement-cell-login" },
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
      { label: "Our Services", href: "/solutions" },
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

function FooterLinks({ links }: { links: readonly FooterLink[] }) {
  return (
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href}>{link.icon && <link.icon className="zb-footer-link-icon" aria-hidden="true" />}{link.label}</Link>
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
      {/* Native disclosures work on phones without extra client JavaScript.
          CSS exposes only one version of each group at a time. */}
      <details className={`zb-footer-mobile-group${group.title === "For business" ? " zb-footer-business-group" : ""}`} open={group.title === "For business"}>
        <summary>
          <h2>{group.title}<ChevronDown aria-hidden="true" /></h2>
        </summary>
        <nav aria-label={group.label}>
          <FooterLinks links={group.links} />
        </nav>
      </details>
    </>
  );
}

export function Footer() {
  return (
    <footer className="zb-footer">
      <div className="zb-container">
        <div className="zb-footer-grid">
          <div className="zb-footer-intro">
            <Link href="/" className="zb-wordmark" aria-label="ZOBHUNGER home">
              ZOB<span>HUNGER</span>
            </Link>
            <p>{site.description}</p>
            <ActionLink href={site.primaryAction.href} variant="light">
              Tell us what you need
            </ActionLink>
          </div>

          {footerGroups.map((group) => <FooterLinkGroup key={group.title} group={group} />)}
        </div>
        <div className="zb-footer-bottom">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p>{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
