import type { Metadata } from "next";
import { AdminComplianceDesk } from "@/components/compliance/AdminComplianceDesk";
export const metadata: Metadata = { title: "PF / EPFO Compliance | ZOBHUNGER Admin", robots: { index: false, follow: false } };
export default function Page(){ return <AdminComplianceDesk area="pf"/>; }
