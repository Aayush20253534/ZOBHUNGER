import Link from "next/link";
import { ActionLink } from "@/components/common/ActionLink";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";

export function Footer() {
  return (
    <footer className="zb-footer">
      <div className="zb-container">
        <div className="zb-footer-grid">
          <div className="zb-footer-intro">
            <Link href="/" className="zb-wordmark" aria-label="Zobhunger home">
              ZOB<span>HUNGER</span>
            </Link>
            <p>{site.description}</p>
            <ActionLink href={site.primaryAction.href} variant="light">
              Tell us what you need
            </ActionLink>
          </div>
          <nav aria-label="Solutions in footer">
            <h2>Solutions</h2>
            <ul>
              {solutions.map((solution) => (
                <li key={solution.slug}>
                  <Link href={`/${solution.slug}`}>{solution.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Business links in footer">
            <h2>For your business</h2>
            <ul>
              <li>
                <Link href="/for-business">Work with ZOBHUNGER</Link>
              </li>
              <li>
                <Link href="/how-it-works">How it works</Link>
              </li>
              <li>
                <Link href="/industries">Industries we serve</Link>
              </li>
              <li>
                <Link href="/hire-workforce">Share a requirement</Link>
              </li>
              <li>
                <Link href="/contact">Talk to our team</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Company links in footer">
            <h2>Company & opportunities</h2>
            <ul>
              <li>
                <Link href="/about">About us</Link>
              </li>
              <li>
                <Link href="/brand-experience">Brand experience</Link>
              </li>
              <li>
                <Link href="/case-studies">Case studies</Link>
              </li>
              <li>
                <Link href="/technology">Our technology vision</Link>
              </li>
              <li>
                <Link href="/for-workers">For workers</Link>
              </li>
              <li>
                <Link href="/jobs">Careers & jobs</Link>
              </li>
              <li>
                <Link href="/blog">Blog & insights</Link>
              </li>
              <li>
                <Link href="/login">Portal access</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
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
