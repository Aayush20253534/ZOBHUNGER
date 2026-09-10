import { Technology } from "@/components/company/Technology";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Connected Workforce & Business Technology",
  "Explore ZOBHUNGER's live business, worker, institution and operations workspaces for connected hiring, deployment, attendance and reporting.",
  "/technology",
);

export default function Page() {
  return <Technology />;
}
