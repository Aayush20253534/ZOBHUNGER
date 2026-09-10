import type { Metadata } from "next";
import { EmployeeJoiningForm } from "@/components/hr/EmployeeJoiningForm";
import "@/styles/employee-joining.css";

export const metadata: Metadata = {
  title: "Employee Joining | ZOBHUNGER HR",
  description: "Private employee onboarding form for Zobhungr Solutions Private Limited.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export default function EmployeeJoiningPage() {
  return <EmployeeJoiningForm />;
}
