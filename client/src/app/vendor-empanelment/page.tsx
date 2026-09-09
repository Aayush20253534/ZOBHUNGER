import { VendorLanding } from "@/components/vendors/VendorLanding";
import { getPageMetadata } from "@/lib/page-metadata";
export const metadata = getPageMetadata("Vendor Empanelment & Onboarding", "Apply to join ZOBHUNGER’s vendor network for workforce, recruitment, marketing, operational and specialist services.", "/vendor-empanelment");
export default function Page() { return <VendorLanding />; }
