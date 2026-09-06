import { ForWorkers } from "@/components/workers/ForWorkers";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Find Work With ZOBHUNGER",
  "Explore sales, promoter, field, marketing, telecalling, recruitment and operations roles with ZOBHUNGER.",
  "/for-workers",
);

export default function Page() {
  return <ForWorkers />;
}
