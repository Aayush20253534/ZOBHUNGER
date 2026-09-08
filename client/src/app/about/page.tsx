import { About } from "@/components/company/About";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "About ZOBHUNGER",
  "Learn how ZOBHUNGER connects workforce, deployment and on-ground business execution across sales, retail, activation and operations.",
  "/about",
);

export default function Page() {
  return <About />;
}
