import { PartnerProgramPage } from "@/components/partners/PartnerProgramPage";
import { partnerProgramIntro } from "@/data/partner-program";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Become an Independent Business Partner",
  partnerProgramIntro.description,
  "/become-a-partner",
);

export default function Page() {
  return <PartnerProgramPage />;
}
