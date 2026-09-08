import { AdminAttendance } from "@/components/admin/AdminAttendance";
import { attendancePageDate } from "@/lib/attendance-page";
export const metadata = { title: "Assignment & attendance | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <AdminAttendance id={id} initialDate={attendancePageDate(query.date)} />;
}
