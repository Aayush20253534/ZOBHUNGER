import { RequirementPageContent } from "@/components/company/RequirementPageContent";
import { getFormSelection, type FormSearchParams } from "@/lib/form-selection";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Share Your Workforce Requirement",
  "Tell ZOBHUNGER the service, team size, locations and timeline your business needs. Share a workforce or business execution requirement.",
  "/hire-workforce",
);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<FormSearchParams>;
}) {
  const selection = getFormSelection(await searchParams);
  return <RequirementPageContent {...selection} />;
}
