import { BusinessRequirementDetail } from "@/components/business/BusinessRequirementDetail";
export const metadata = { title: "Requirement brief" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BusinessRequirementDetail id={id} />;
}
