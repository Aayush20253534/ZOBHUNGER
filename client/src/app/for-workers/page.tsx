import { ForWorkers } from "@/components/workers/ForWorkers";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Find Work With ZOBHUNGER",
  "Create a worker profile, explore and apply for published opportunities, and manage assignments, attendance and earnings through ZOBHUNGER's worker space.",
  "/for-workers",
);

export default function Page() {
  return <ForWorkers />;
}
