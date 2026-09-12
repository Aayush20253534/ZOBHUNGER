import type { Metadata } from "next";
import { AdminBlogManagement } from "@/components/admin/AdminBlogManagement";

export const metadata: Metadata = {
  title: "Blog & Content | ZOBHUNGER",
  description: "Protected editorial publishing workspace.",
  robots: { index: false, follow: false },
};

export default function AdminBlogPage() { return <AdminBlogManagement />; }
