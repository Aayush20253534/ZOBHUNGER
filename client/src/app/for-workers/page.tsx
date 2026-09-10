import { ForWorkers } from "@/components/workers/ForWorkers";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Find Work With ZOBHUNGER",
  "Submit your worker profile and CV for ZOBHUNGER review. Approved workers are contacted when their details match a suitable project or role.",
  "/for-workers",
);

export default function Page() {
  return <ForWorkers />;
}
