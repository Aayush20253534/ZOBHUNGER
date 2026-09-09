import { WorkerApplications } from "@/components/worker/WorkerApplications";
import { AdminWorkerGate } from "@/components/admin/AdminWorkerGate";
export const metadata = { title: "Worker operations | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function Page() { return <AdminWorkerGate><WorkerApplications admin /></AdminWorkerGate>; }
