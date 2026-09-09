import { ForBusiness } from "@/components/company/ForBusiness";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Business Registration, Login & Workforce Management",
  "Register your business or log in to ZOBHUNGER to manage requirements, review candidates, follow deployments, approve attendance and access reports.",
  "/for-business",
);

export default function Page() {
  return <ForBusiness />;
}
