import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("promoter-solutions");

export default function Page() {
  return <SolutionDetail slug="promoter-solutions" />;
}
