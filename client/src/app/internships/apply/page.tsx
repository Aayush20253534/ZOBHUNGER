import type { Metadata } from "next";
import { InternshipApplicationForm } from "@/components/internships/InternshipApplicationForm";
import "@/styles/employee-joining.css";

export const metadata: Metadata = {
  title: "Apply for Internship | ZOBHUNGER",
  description: "Apply for an internship at ZOBHUNGER by sharing your education, preferred role, location and resume.",
  alternates: { canonical: "/internships/apply" },
  robots: { index: false, follow: true },
};

export default function InternshipApplicationPage() {
  return <InternshipApplicationForm />;
}
