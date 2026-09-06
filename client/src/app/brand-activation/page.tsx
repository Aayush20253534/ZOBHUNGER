import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("brand-activation");

export default function Page() {
  return <SolutionDetail slug="brand-activation" />;
}
