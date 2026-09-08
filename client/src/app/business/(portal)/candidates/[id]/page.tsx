import { BusinessCandidatePage } from "@/components/business/candidates/CandidateWorkspace";
export const metadata = { title: "Candidate profile" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BusinessCandidatePage id={id} />;
}
