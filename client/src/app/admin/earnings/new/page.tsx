import { AdminWorkerGate } from "@/components/admin/AdminWorkerGate";
import { AdminEarningsCreate } from "@/components/admin/AdminEarnings";
export const metadata = { title: "New earnings statement | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function Page() { return <AdminWorkerGate><AdminEarningsCreate /></AdminWorkerGate>; }
