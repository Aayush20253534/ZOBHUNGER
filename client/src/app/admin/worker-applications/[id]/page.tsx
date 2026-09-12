import { WorkerApplicationDetail } from "@/components/worker/WorkerApplications";
import { AdminWorkerGate } from "@/components/admin/AdminWorkerGate";
export const metadata = { title: "Hiring applications | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminWorkerGate><WorkerApplicationDetail id={id} admin /></AdminWorkerGate>; }
