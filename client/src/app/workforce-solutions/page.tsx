import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("workforce-solutions");

export default function Page() {
  return <SolutionDetail slug="workforce-solutions" />;
}
