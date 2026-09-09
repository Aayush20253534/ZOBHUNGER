import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("verification-services");

export default function Page() {
  return <SolutionDetail slug="verification-services" />;
}
