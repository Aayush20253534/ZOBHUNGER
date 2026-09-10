import { BadgeCheck, FileText, GraduationCap, UsersRound } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ApplicationJourney } from "@/components/common/ApplicationJourney";
import { CareerProfileForm } from "@/components/careers/CareerProfileForm";
import { CareerImage } from "@/components/careers/CareerImage";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/intake.css";

export const metadata = getPageMetadata("Submit Your Career Profile", "Submit your education, experience, skills and resume for ZOBHUNGER review, verification and project-fit assessment.", "/careers/apply");
export default function Page() {
  return <div className="zb-intake-page">
    <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Careers", href: "/careers" }, { label: "Submit your profile" }]} />
    <header className="zb-intake-heading"><span className="zb-eyebrow">Careers · Meet your next opportunity</span><h1>Your experience.<br />Your skills. Your next chapter.</h1><p>Submit your profile first. Our team will review and verify the required details, and if your profile is approved we will contact you when there is a suitable project or role to proceed with.</p></header>
    <ApplicationJourney kind="career" />
    <div className="zb-intake-layout"><CareerProfileForm /><aside className="zb-intake-aside" aria-labelledby="career-profile-guide">
      <figure><CareerImage scene="learning-together" sizes="(min-width: 960px) 360px, (min-width: 640px) 560px, calc(100vw - 48px)" /><figcaption><UsersRound aria-hidden="true" />People behind the work</figcaption></figure>
      <div><span className="zb-eyebrow">Put your best story forward</span><h2 id="career-profile-guide">Help us understand your strengths.</h2>
      <ul><li><GraduationCap aria-hidden="true" /><span>Include your latest qualification and relevant training.</span></li><li><BadgeCheck aria-hidden="true" /><span>Describe the work you have done and the skills you can bring.</span></li><li><FileText aria-hidden="true" /><span>Attach a clear, up-to-date PDF resume. Freshers are welcome.</span></li></ul></div>
    </aside></div>
  </div>;
}
