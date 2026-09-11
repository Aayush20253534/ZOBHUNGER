import type { Metadata } from "next";
import { AdminAccessManagement } from "@/components/admin/AdminAccessManagement";
import "@/styles/admin-access.css";

export const metadata: Metadata = {
  title: "Admin Access | ZOBHUNGER",
  description: "Protected department administrator access management.",
  robots: { index: false, follow: false },
};

export default function AdminAccessPage() {
  return <AdminAccessManagement />;
}
