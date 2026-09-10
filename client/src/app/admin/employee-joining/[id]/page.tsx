import type { Metadata } from "next";
import { AdminEmployeeJoiningDetail } from "@/components/hr/AdminEmployeeJoining";
export const metadata: Metadata = { title: "Employee HR record | ZOBHUNGER Admin", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminEmployeeJoiningDetail id={id} />; }
