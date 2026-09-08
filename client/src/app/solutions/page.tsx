import { SolutionsOverview } from "@/components/solutions/SolutionsOverview";
import { getPageMetadata } from "@/lib/page-metadata";

const description =
  "Explore ZOBHUNGER's workforce, sales, promoter, retail, activation, business operations and gig workforce solutions. Find the right support for your business.";

export const metadata = getPageMetadata(
  "Our Services",
  description,
  "/solutions",
);

export default function Page() {
  return <SolutionsOverview />;
}
