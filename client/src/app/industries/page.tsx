import { IndustriesOverview } from "@/components/industries/IndustriesOverview";
import { industriesOverview } from "@/data/industry-details";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Industries We Serve",
  industriesOverview.description,
  "/industries",
);

export default function Page() {
  return <IndustriesOverview />;
}
