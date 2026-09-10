import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("website-application-development");

export default function Page() {
  return <SolutionDetail slug="website-application-development" />;
}
