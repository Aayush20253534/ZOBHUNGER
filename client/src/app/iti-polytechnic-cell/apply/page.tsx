import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { TechnicalInstituteApplicationForm } from "@/components/technical-institutes/TechnicalInstituteApplicationForm";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/technical-institute-cell.css";

export const metadata = {
  ...getPageMetadata(
    "ITI & Polytechnic Institute Onboarding",
    "Submit your ITI, Polytechnic or technical institute profile for ZOBHUNGER technical talent partnership review.",
    "/iti-polytechnic-cell/apply",
  ),
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="zb-tech-apply-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "ITI & Polytechnic College Cell", href: "/iti-polytechnic-cell" },
          { label: "Institute Onboarding" },
        ]}
      />

      <header className="zb-tech-apply-header">
        <span className="zb-eyebrow">Technical institute onboarding</span>
        <h1>Partner Your ITI or Polytechnic With ZOBHUNGER</h1>
        <p>
          Share your institute, placement contact, technical branches and student profile. This intake is dedicated to technical hiring, apprenticeships, internships and training partnerships.
        </p>
      </header>

      <div className="zb-tech-apply-layout">
        <div className="zb-tech-form-panel">
          <TechnicalInstituteApplicationForm />
        </div>
        <aside className="zb-tech-apply-aside">
          <span className="zb-eyebrow">What happens next</span>
          <h2>A focused technical partnership review.</h2>
          <ol>
            <li><b>01</b><span><strong>Institute profile review</strong>We verify the submitted institute, location and authorized contact details.</span></li>
            <li><b>02</b><span><strong>Trade & branch mapping</strong>Your technical disciplines and student strength are mapped for future sourcing.</span></li>
            <li><b>03</b><span><strong>Partnership follow-up</strong>The team contacts suitable institutes for onboarding, drives or active requirements.</span></li>
          </ol>
          <div className="zb-tech-apply-aside-note">
            <strong>Separate from general Placement Cell onboarding.</strong>
            <p>This form is specifically for ITIs, Polytechnic colleges and technical institutes supporting technical candidate sourcing.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
