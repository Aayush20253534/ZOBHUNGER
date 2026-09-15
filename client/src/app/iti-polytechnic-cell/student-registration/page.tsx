import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { TechnicalStudentRegistrationForm } from "@/components/technical-institutes/TechnicalStudentRegistrationForm";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/technical-institute-cell.css";
import "@/styles/technical-student-registration.css";

export const metadata = {
  ...getPageMetadata(
    "Technical Student Registration | ITI & Polytechnic College Cell",
    "Register an ITI or Polytechnic student profile with an approved ZOBHUNGER technical institute partner.",
    "/iti-polytechnic-cell/student-registration",
  ),
  robots: { index: false, follow: true },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  return <div className="zb-tech-student-page">
    <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "ITI & Polytechnic College Cell", href: "/iti-polytechnic-cell" }, { label: "Student Registration" }]} />
    <header className="zb-tech-student-header">
      <div><span className="zb-eyebrow">Technical student onboarding</span><h1>Turn your technical qualification into the right opportunity path.</h1><p>Students from approved partner ITIs and Polytechnic colleges can create a structured profile for relevant jobs, internships, apprenticeships and training.</p></div>
      <div className="zb-tech-student-header-points"><span><BadgeCheckIcon />Partner institute verification</span><span><WrenchIcon />Trade / branch mapping</span><span><GraduationIcon />Qualification-led eligibility</span></div>
    </header>
    <TechnicalStudentRegistrationForm initialCode={params.code ?? ""} />
  </div>;
}

function BadgeCheckIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 12 2 2 4-4"/><path d="M12 3 9.8 4.4l-2.6-.2-1 2.4L4 8l.7 2.5L4 13l2.2 1.4 1 2.4 2.6-.2L12 18l2.2-1.4 2.6.2 1-2.4L20 13l-.7-2.5L20 8l-2.2-1.4-1-2.4-2.6.2Z"/></svg>; }
function WrenchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3Z"/></svg>; }
function GraduationIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 10 10-5 10 5-10 5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>; }
