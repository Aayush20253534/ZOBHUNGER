import type { Metadata } from "next";
import { AdminAiAssistant } from "@/components/admin/AdminAiAssistant";

export const metadata: Metadata = {
  title: "AI Assistant | ZOBHUNGER Admin",
  robots: { index: false, follow: false },
};

export default function AiAssistantAdminPage() {
  return <AdminAiAssistant />;
}
