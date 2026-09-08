import { BusinessRequirementEditor } from "@/components/business/BusinessRequirementEditor";
export const metadata = { title: "Edit requirement" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BusinessRequirementEditor id={id} />;
}
