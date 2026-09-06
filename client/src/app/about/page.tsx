import { About } from "@/components/company/About";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "About ZOBHUNGER",
  "ZOBHUNGER is building an integrated workforce, sales and business execution platform for businesses and workers across India.",
  "/about",
);

export default function Page() {
  return <About />;
}
