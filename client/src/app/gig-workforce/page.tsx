import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("gig-workforce");

export default function Page() {
  return <SolutionDetail slug="gig-workforce" />;
}
