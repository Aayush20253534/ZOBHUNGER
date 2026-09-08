import { AdminAttendance } from "@/components/admin/AdminAttendance";
import { attendancePageDate } from "@/lib/attendance-page";
export const metadata = { title: "Attendance operations | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return <AdminAttendance initialDate={attendancePageDate(query.date)} initialTab={typeof query.tab === "string" ? query.tab : undefined} />;
}
