import { ContactPageContent } from "@/components/company/ContactPageContent";
import { getFormSelection, type FormSearchParams } from "@/lib/form-selection";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Contact ZOBHUNGER",
  "Ask about workforce, sales, promoters, retail execution and business operations. Start with a business enquiry.",
  "/contact",
);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<FormSearchParams>;
}) {
  const selection = getFormSelection(await searchParams);
  return <ContactPageContent {...selection} />;
}
