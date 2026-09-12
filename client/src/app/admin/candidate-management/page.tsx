import { AdminCandidateManagement } from "@/components/admin/AdminCandidateManagement";
export const metadata = { title: "Candidate sharing & reviews | ZOBHUNGER", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ requirementId?: string | string[] }> }) {
  const params = await searchParams;
  const raw = Array.isArray(params.requirementId) ? params.requirementId[0] : params.requirementId;
  const requirementId = raw?.trim() || undefined;
  return <AdminCandidateManagement requirementId={requirementId} />;
}
