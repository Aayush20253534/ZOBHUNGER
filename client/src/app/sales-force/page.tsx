import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("sales-force");

export default function Page() {
  return <SolutionDetail slug="sales-force" />;
}
