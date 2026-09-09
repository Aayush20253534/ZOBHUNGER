import Link from "next/link";
import { ArrowUpRight, Handshake } from "lucide-react";
import "@/styles/vendors.css";

export function VendorInvitation({ href = "/vendor-empanelment" }: { href?: string }) {
  return <section className="zb-vendor-invitation" aria-label="Vendor empanelment invitation">
    <span className="zb-vendor-invitation-icon"><Handshake aria-hidden="true" /></span>
    <div><span>Vendor Empanelment / Vendor Onboarding</span><h2>Your expertise. Our next opportunity.</h2><p>Companies, agencies, MSMEs and startups: join our vendor network for suitable projects across workforce, marketing and business support.</p></div>
    <Link href={href}>Explore vendor empanelment<ArrowUpRight aria-hidden="true" /></Link>
  </section>;
}
