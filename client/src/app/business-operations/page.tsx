import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("business-operations");

export default function Page() {
  return <SolutionDetail slug="business-operations" />;
}
