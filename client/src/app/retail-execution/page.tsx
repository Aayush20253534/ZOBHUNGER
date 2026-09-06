import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("retail-execution");

export default function Page() {
  return <SolutionDetail slug="retail-execution" />;
}
