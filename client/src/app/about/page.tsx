import { About } from "@/components/company/About";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "About ZOBHUNGER",
  "Learn how ZOBHUNGER connects workforce, deployment and on-ground execution for clients worldwide, with an operating footprint anchored in India.",
  "/about",
);

export default function Page() {
  return <About />;
}
