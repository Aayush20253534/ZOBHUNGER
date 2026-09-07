import type { Metadata } from "next";
import { SolutionsOverview } from "@/components/solutions/SolutionsOverview";
import { site } from "@/data/site";

const description =
  "Explore ZOBHUNGER's workforce, sales, promoter, retail, activation, business operations and gig workforce solutions. Find the right support for your business.";

export const metadata: Metadata = {
  title: "Our Services",
  description,
  alternates: { canonical: `${site.url}/solutions` },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    title: `Our Services | ${site.name}`,
    description,
    url: `${site.url}/solutions`,
  },
};

export default function Page() {
  return <SolutionsOverview />;
}
