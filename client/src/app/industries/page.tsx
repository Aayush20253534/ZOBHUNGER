import type { Metadata } from "next";
import { IndustriesOverview } from "@/components/industries/IndustriesOverview";
import { industriesOverview } from "@/data/industry-details";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Industries We Serve",
  description: industriesOverview.description,
  alternates: { canonical: `${site.url}/industries` },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    title: `Industries We Serve | ${site.name}`,
    description: industriesOverview.description,
    url: `${site.url}/industries`,
  },
};

export default function Page() {
  return <IndustriesOverview />;
}
