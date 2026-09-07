import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PlacementCellApplicationForm } from "@/components/placement/PlacementCellApplicationForm";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/placement-partnership.css";

export const metadata = getPageMetadata(
  "Placement Cell & Institution Onboarding",
  "Submit your College, University, Training Institute or Placement Cell details for ZOBHUNGER partnership review.",
  "/placement-cell-partnership/apply",
);

export default function Page() {
  return <div className="zb-placement-apply-page">
    <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Placement Cell Partnership",href:"/placement-cell-partnership"},{label:"Institution Onboarding"}]} />
    <header className="zb-placement-apply-header"><span className="zb-eyebrow">Institution onboarding</span><h1>Onboard Your Placement Cell</h1><p>Share your institution and Placement Cell details. Our team will review the request before providing approved partner portal access.</p></header>
    <div className="zb-placement-apply-layout"><div className="zb-placement-form-panel"><PlacementCellApplicationForm /></div><aside className="zb-placement-apply-aside"><span className="zb-eyebrow">What happens next</span><h2>A controlled onboarding process.</h2><ol><li><b>01</b><span><strong>Submit institution details</strong>Complete the official onboarding form.</span></li><li><b>02</b><span><strong>ZOBHUNGER review</strong>Our team verifies the institution and partnership fit.</span></li><li><b>03</b><span><strong>Approval & portal access</strong>Approved partners receive separate Placement Cell access.</span></li></ol><p>Submitting this form does not guarantee approval or automatically create login credentials.</p></aside></div>
  </div>;
}
