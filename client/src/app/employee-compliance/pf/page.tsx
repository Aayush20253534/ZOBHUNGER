import type { Metadata } from "next";
import { PfComplianceForm } from "@/components/compliance/PfComplianceForm";
import "@/styles/employee-joining.css";
import "@/styles/compliance.css";

export const metadata: Metadata = { title: "PF / EPFO Compliance | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <PfComplianceForm />; }
