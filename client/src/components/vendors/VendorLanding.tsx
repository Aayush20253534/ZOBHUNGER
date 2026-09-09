import { ArrowDown, ArrowUpRight, BadgeCheck, Building2, ClipboardCheck, FileCheck2, Handshake, Network, ShieldCheck } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SectionHeading } from "@/components/common/SectionHeading";
import { CareerImage } from "@/components/careers/CareerImage";
import { VendorApplicationForm } from "./VendorApplicationForm";
import { vendorCategories } from "@/data/vendors";
import "@/styles/intake.css";
import "@/styles/vendors.css";

export function VendorLanding({ workspace = false }: { workspace?: boolean }) {
  return <div className="zb-vendor-page zb-intake-page">
    {!workspace && <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "For business", href: "/for-business" }, { label: "Vendor empanelment" }]} />}
    <div className="zb-vendor-hero">
      <header className="zb-intake-heading"><span className="zb-eyebrow">Vendor Empanelment / Vendor Onboarding</span><h1>Bring your expertise.<br />Build what comes next.</h1><p>Join ZOBHUNGER’s vendor partner network. We welcome companies, agencies, MSMEs, startups and specialist service providers ready to deliver on suitable projects.</p><div className="zb-intake-actions"><ActionLink href="#vendor-application">Apply for empanelment<ArrowDown aria-hidden="true" /></ActionLink><ActionLink href="#vendor-capabilities" variant="secondary">Explore service areas<ArrowUpRight aria-hidden="true" /></ActionLink></div><p className="zb-vendor-hero-note"><ShieldCheck aria-hidden="true" />Company review before empanelment. Opportunities based on project fit.</p></header>
      <aside className="zb-vendor-network" aria-label="A network built around complementary expertise">
        <div className="zb-vendor-network-image"><CareerImage scene="team-collaboration" sizes="(min-width: 1000px) 440px, (min-width: 600px) 520px, calc(100vw - 32px)" priority /><span><Handshake aria-hidden="true" />A partnership built on delivery</span></div>
        <div className="zb-vendor-network-body"><div><Network aria-hidden="true" /><h2>One network. Complementary strengths.</h2></div><ul>{vendorCategories.map(({ value, shortLabel, icon: Icon }) => <li key={value}><Icon aria-hidden="true" />{shortLabel}</li>)}</ul></div>
      </aside>
    </div>
    <section id="vendor-capabilities" className="zb-vendor-section" aria-labelledby="vendor-capabilities-title"><SectionHeading id="vendor-capabilities-title" eyebrow="Where we collaborate" title="Expertise that strengthens every project." description="Tell us where your team adds value. You can apply for more than one service area." /><div className="zb-vendor-capability-grid">{vendorCategories.map(({ value, label, description, icon: Icon }) => <article key={value}><Icon aria-hidden="true" /><h3>{label}</h3><p>{description}</p></article>)}</div></section>
    <div className="zb-intake-journey zb-vendor-journey"><p><BadgeCheck aria-hidden="true" />A clear path to empanelment</p><ol>
      <li><span className="zb-intake-journey-icon"><Building2 aria-hidden="true" /></span><div><small>01</small><h3>Introduce your company</h3><p>Share services, experience, coverage and your company profile.</p></div></li>
      <li><span className="zb-intake-journey-icon"><ClipboardCheck aria-hidden="true" /></span><div><small>02</small><h3>Review & evaluation</h3><p>Our team reviews the application and follows up where needed.</p></div></li>
      <li><span className="zb-intake-journey-icon"><Handshake aria-hidden="true" /></span><div><small>03</small><h3>Empanelment & opportunities</h3><p>Approved vendors receive a Vendor Code and can be considered for suitable projects.</p></div></li>
    </ol></div>
    <section id="vendor-application" className="zb-vendor-section" aria-labelledby="vendor-form-title"><SectionHeading id="vendor-form-title" eyebrow="Introduce your business" title="Vendor empanelment form" description="Give our team a clear picture of your capabilities. A company profile PDF is required; other supporting documents are optional." /><div className="zb-intake-layout"><VendorApplicationForm /><aside className="zb-intake-aside"><div><span className="zb-eyebrow">A useful application</span><h2>Make your strengths easy to review.</h2><ul><li><Building2 aria-hidden="true" /><span>Use your company’s details and an authorised point of contact.</span></li><li><BadgeCheck aria-hidden="true" /><span>Describe relevant work, the team you can provide and your service coverage.</span></li><li><FileCheck2 aria-hidden="true" /><span>Attach readable PDFs, up to 2 MB each. Add registration or certifications where applicable.</span></li><li><ShieldCheck aria-hidden="true" /><span>Your documents are available only to our authorised review team.</span></li></ul><p>Empanelment confirms inclusion in our vendor network. Project allocation depends on requirements, capability and availability.</p></div></aside></div></section>
  </div>;
}
