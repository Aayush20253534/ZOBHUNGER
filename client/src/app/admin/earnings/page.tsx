import { AdminWorkerGate } from "@/components/admin/AdminWorkerGate";
import { AdminEarnings } from "@/components/admin/AdminEarnings";
export const metadata = { title: "Earnings management | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function Page() { return <AdminWorkerGate><AdminEarnings /></AdminWorkerGate>; }
