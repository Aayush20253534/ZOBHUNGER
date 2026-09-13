import type { Metadata } from "next";
import { EmployeeComplianceLanding } from "@/components/compliance/EmployeeComplianceLanding";
import "@/styles/employee-joining.css";
import "@/styles/compliance.css";

export const metadata: Metadata = { title: "Employee Compliance | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <EmployeeComplianceLanding />; }
