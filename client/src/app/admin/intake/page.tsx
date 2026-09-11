import type { Metadata } from "next";
import { AdminOperationsIntake } from "@/components/admin/AdminOperationsIntake";

export const metadata: Metadata = {
  title: "Requests & Intake | ZOBHUNGER",
  description: "Protected department-scoped operational intake workspace.",
  robots: { index: false, follow: false },
};

export default function AdminIntakePage() { return <AdminOperationsIntake />; }
