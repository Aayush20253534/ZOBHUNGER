import { HowItWorks } from "@/components/company/HowItWorks";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "From Requirement to Execution",
  "Understand the six steps from sharing a workforce requirement through sourcing, selection, deployment and project reporting.",
  "/how-it-works",
);

export default function Page() {
  return <HowItWorks />;
}
