import { AdminWorkerGate } from "@/components/admin/AdminWorkerGate";
import { AdminEarningsDetail } from "@/components/admin/AdminEarnings";
export const metadata = { title: "Earnings statement | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminWorkerGate><AdminEarningsDetail id={id} /></AdminWorkerGate>; }
