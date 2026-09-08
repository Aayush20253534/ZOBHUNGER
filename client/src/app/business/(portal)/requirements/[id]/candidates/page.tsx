import { BusinessCandidates } from "@/components/business/candidates/CandidateWorkspace";
export const metadata = { title: "Requirement candidates" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BusinessCandidates requirementId={id} />;
}
