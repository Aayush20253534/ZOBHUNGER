import Link from "next/link";
import { ActionLink } from "@/components/common/ActionLink";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";

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
  { label: "Jobs & opportunities", href: "/jobs" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Hire workforce", href: "/hire-workforce" },
  { label: "Portal access", href: "/login" },
] as const;

const partnershipLinks = [
  { label: "Independent Business Partner", href: "/become-a-partner" },
  {
    label: "Placement Cell & Institution Partnership",
    href: "/placement-cell-partnership",
  },
  { label: "Placement Cell Login", href: "/placement-cell-login" },
] as const;

const resourceLinks = [
  { label: "Blog & insights", href: "/blogs" },
  { label: "Industries we serve", href: "/industries" },
  { label: "Technology vision", href: "/technology" },
] as const;

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

          <nav aria-label="Company links in footer">
            <h2>Company</h2>
            <ul>
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services in footer">
            <h2>Services</h2>
            <ul>
              <li>
                <Link href="/solutions">Our Services</Link>
              </li>
              {solutions.map((solution) => (
                <li key={solution.slug}>
                  <Link href={`/${solution.slug}`}>{solution.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Opportunity links in footer">
            <h2>Opportunities</h2>
            <ul>
              {opportunityLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Partnership links in footer">
            <h2>Partnerships</h2>
            <ul>
              {partnershipLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resource links in footer">
            <h2>Resources</h2>
            <ul>
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
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
