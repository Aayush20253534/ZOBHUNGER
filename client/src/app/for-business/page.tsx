import { ForBusiness } from "@/components/company/ForBusiness";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Partner Applications, Business Login & Workforce Management",
  "Apply to become a partner or log in to your approved ZOBHUNGER business account to manage requirements, review candidates, follow deployments, approve attendance and access reports.",
  "/for-business",
);

export default function Page() {
  return <ForBusiness />;
}
