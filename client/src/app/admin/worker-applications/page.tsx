import { WorkerApplications } from "@/components/worker/WorkerApplications";
import { AdminWorkerGate } from "@/components/admin/AdminWorkerGate";
export const metadata = { title: "Hiring applications | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }
export default async function Page({ searchParams }: { searchParams: Promise<{ source?: string | string[]; jobId?: string | string[]; requirementId?: string | string[] }> }) {
  const params = await searchParams;
  return <AdminWorkerGate><WorkerApplications admin initialSource={first(params.source)} initialJobId={first(params.jobId)} initialRequirementId={first(params.requirementId)} /></AdminWorkerGate>;
}
