import type { Metadata } from "next";
import { AdminAccessActivation } from "@/components/admin/AdminAccessActivation";
import "@/styles/admin-access-activation.css";

export const metadata: Metadata = {
  title: "Activate Administrator Access | ZOBHUNGER",
  description: "Secure one-time activation for ZOBHUNGER department administrators.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AdminAccessActivationPage() {
  return <AdminAccessActivation />;
}
