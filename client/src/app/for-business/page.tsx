import { ForBusiness } from "@/components/company/ForBusiness";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Build and Manage Your Team",
  "Recruitment, sales teams, promoters and market execution. Shape a workforce solution around your business requirement.",
  "/for-business",
);

export default function Page() {
  return <ForBusiness />;
}
