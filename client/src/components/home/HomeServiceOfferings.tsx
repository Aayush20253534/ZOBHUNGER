import Link from "next/link";
import { ArrowUpRight, Megaphone, ShieldCheck, Workflow } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { getActivityIcon } from "@/components/solutions/solution-icons";
import { brandingServices, businessSupportServices, verificationServices } from "@/data/service-expansion";
import "@/styles/service-offerings.css";

const offerings = [
  { id: "verification", title: "Verification services", icon: ShieldCheck, description: "We provide reliable and transparent verification services to help businesses make confident decisions.", services: verificationServices, href: "/verification-services", action: "Explore verification services" },
  { id: "branding", title: "Branding & activation", icon: Megaphone, description: "Bring your brand into everyday market moments with coordinated campaigns, visible placements and direct customer engagement.", services: brandingServices, href: "/brand-activation#solution-services", action: "Explore branding & activation" },
];

export function HomeServiceOfferings() {
  return <div className="zb-offerings" id="execution-service-offerings">
    <div className="zb-offerings-grid">
      {offerings.map(({ id, title, icon: Icon, description, services, href, action }) => <article key={id} className="zb-offering" data-offering={id} aria-labelledby={"offering-" + id}>
        <div className="zb-offering-heading"><span className="zb-offering-icon"><Icon aria-hidden="true" /></span><div><span className="zb-eyebrow">Our services</span><h3 id={"offering-" + id}>{title}</h3></div></div>
        <p>{description}</p>
        <ul>{services.map(service => { const ServiceIcon = getActivityIcon(service.title); return <li key={service.title}><ServiceIcon aria-hidden="true" /><span>{service.title}{service.title === "Custom Verification" && <small>As per your business requirements</small>}</span></li>; })}</ul>
        <ActionLink href={href} variant="text">{action}<ArrowUpRight aria-hidden="true" /></ActionLink>
      </article>)}
    </div>
    <div className="zb-offering-support">
      <div className="zb-offering-support-heading"><Workflow aria-hidden="true" /><div><h3>One platform. Multiple solutions. Reliable execution.</h3><p>Along with verification, we provide end-to-end workforce and business support: recruitment, onboarding, KYC, telecalling, sales, field operations, content moderation and other hyperlocal business operations.</p></div></div>
      <nav aria-label="Workforce and business support services">{businessSupportServices.map(service => <Link href={"/" + service.slug} key={service.label}>{service.label}<ArrowUpRight aria-hidden="true" /></Link>)}</nav>
    </div>
  </div>;
}
