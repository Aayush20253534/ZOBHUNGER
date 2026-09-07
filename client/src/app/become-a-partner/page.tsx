import type { Metadata } from "next";
import { PartnerProgramPage } from "@/components/partners/PartnerProgramPage";
import { partnerProgramIntro } from "@/data/partner-program";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Become a Partner",
  description: partnerProgramIntro.description,
  alternates: { canonical: `${site.url}/become-a-partner` },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    url: `${site.url}/become-a-partner`,
    title: "Become an Independent Business Partner | ZOBHUNGER",
    description: partnerProgramIntro.description,
  },
};

export default function Page() {
  return <PartnerProgramPage />;
}
