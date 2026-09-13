import type { Metadata } from "next";
import { AdminComplianceDesk } from "@/components/compliance/AdminComplianceDesk";
export const metadata: Metadata = { title: "ESIC Compliance | ZOBHUNGER Admin", robots: { index: false, follow: false } };
export default function Page(){ return <AdminComplianceDesk area="esic"/>; }
