import { AdminWorkerAttendanceDetail } from "@/components/worker/WorkerAttendance";
import { AdminWorkerGate } from "@/components/admin/AdminWorkerGate";
export const metadata = { title: "Worker operations | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminWorkerGate><AdminWorkerAttendanceDetail id={id} /></AdminWorkerGate>; }
