import Link from "next/link";
import { ArrowDown, ArrowUpRight, Megaphone, ShieldCheck } from "lucide-react";
import "@/styles/home-service-spotlight.css";

const featuredServices = [
  {
    title: "Verification services",
    description: "People, documents, addresses and businesses — checked with care.",
    href: "/verification-services",
    icon: ShieldCheck,
    action: "Explore verification",
  },
  {
    title: "Branding activation",
    description: "Stickers, flyers and market campaigns that bring your brand to people.",
    href: "/brand-activation",
    icon: Megaphone,
    action: "Explore brand activation",
  },
];

export function HomeServiceSpotlight() {
  return (
    <section className="zb-service-spotlight" id="verification-branding" aria-labelledby="verification-branding-title">
      <div className="zb-service-spotlight-copy">
        <span className="zb-service-spotlight-eyebrow">Featured services</span>
        <h2 id="verification-branding-title">Verification &amp;<br /><span>Branding Activation</span></h2>
        <p>Build confidence. Create visibility. Put our team to work in your market.</p>
        <a className="zb-service-spotlight-team" href="#home-solutions">See our team in action<ArrowDown aria-hidden="true" /></a>
      </div>
      <nav className="zb-service-spotlight-links" aria-label="Featured verification and branding services">
        {featuredServices.map(({ title, description, href, icon: Icon, action }) => (
          <Link className="zb-service-spotlight-card" href={href} key={href}>
            <span className="zb-service-spotlight-icon"><Icon aria-hidden="true" /></span>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className="zb-service-spotlight-action">{action}<ArrowUpRight aria-hidden="true" /></span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
