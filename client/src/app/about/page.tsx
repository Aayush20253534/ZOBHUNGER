import { About } from "@/components/company/About";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "About ZOBHUNGER",
  "Read the story of Zobhungr Solutions Private Limited and our mission to connect local talent with work, skills and business opportunities closer to home.",
  "/about",
);

export default function Page() {
  return <About />;
}
