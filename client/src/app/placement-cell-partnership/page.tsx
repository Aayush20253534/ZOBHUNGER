import { PlacementCellPartnership } from "@/components/placement/PlacementCellPartnership";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Partner With ZOBHUNGER – Placement Cell & Institution",
  "Connect students with jobs, internships, freelance work, apprenticeships, training and flexible career opportunities through ZOBHUNGER.",
  "/placement-cell-partnership",
);

export default function Page() {
  return <PlacementCellPartnership />;
}
