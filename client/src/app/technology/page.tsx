import { Technology } from "@/components/company/Technology";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Our Technology Vision",
  "Explore the planned client, worker and admin portals for connected hiring, deployment, work updates and reporting.",
  "/technology",
);

export default function Page() {
  return <Technology />;
}
