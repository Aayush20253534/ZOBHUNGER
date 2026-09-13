import type { Metadata } from "next";
import { EsicComplianceForm } from "@/components/compliance/EsicComplianceForm";
import "@/styles/employee-joining.css";
import "@/styles/compliance.css";

export const metadata: Metadata = { title: "ESIC Compliance | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <EsicComplianceForm />; }
