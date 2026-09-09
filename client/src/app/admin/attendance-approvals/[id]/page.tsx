import { AdminApprovals } from "@/components/business/phase2/AttendanceApprovals";
export const metadata = { title: "Attendance decision history", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminApprovals id={id} />; }
