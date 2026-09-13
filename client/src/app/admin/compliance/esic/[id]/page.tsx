import type { Metadata } from "next";
import { AdminComplianceDetail } from "@/components/compliance/AdminComplianceDetail";
export const metadata: Metadata = { title: "ESIC employee record | ZOBHUNGER Admin", robots: { index: false, follow: false } };
export default async function Page({params}:{params:Promise<{id:string}>}){ const {id}=await params; return <AdminComplianceDetail area="esic" id={id}/>; }
