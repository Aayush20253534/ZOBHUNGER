import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { TechnicalInstituteLoginAccess } from "@/components/technical-institute-portal/TechnicalInstituteLoginAccess";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/portal.css";
import "@/styles/technical-institute-portal.css";

export const metadata = {
  ...getPageMetadata("Technical Institute Partner Login", "Secure portal access for approved ZOBHUNGER ITI & Polytechnic College Cell partners.", "/technical-institute-login"),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <div className="zb-portal-page zb-auth-page zb-auth-page--placement"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "ITI & Polytechnic College Cell", href: "/iti-polytechnic-cell" }, { label: "Partner Login" }]} /><TechnicalInstituteLoginAccess /></div>;
}
