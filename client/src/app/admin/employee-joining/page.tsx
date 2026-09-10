import type { Metadata } from "next";
import { AdminEmployeeJoiningList } from "@/components/hr/AdminEmployeeJoining";
export const metadata: Metadata = { title: "Employee joining | ZOBHUNGER Admin", robots: { index: false, follow: false } };
export default function Page() { return <AdminEmployeeJoiningList />; }
