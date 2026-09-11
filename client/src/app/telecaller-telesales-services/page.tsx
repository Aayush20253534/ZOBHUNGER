import { SolutionDetail } from "@/components/solutions/SolutionDetail";
import { getSolutionMetadata } from "@/lib/solution-metadata";

export const metadata = getSolutionMetadata("telecaller-telesales-services");

export default function Page() {
  return <SolutionDetail slug="telecaller-telesales-services" />;
}
