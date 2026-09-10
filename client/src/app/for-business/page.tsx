import { ForBusiness } from "@/components/company/ForBusiness";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Hire Workforce, Manage Requirements & Business Login",
  "Share workforce and execution requirements with ZOBHUNGER, or sign in to an approved business account to review candidates, follow deployments, approve attendance and access reports.",
  "/for-business",
);

export default function Page() {
  return <ForBusiness />;
}
