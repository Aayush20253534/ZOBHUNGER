import { BusinessAttendance } from "@/components/business/attendance/AttendanceWorkspace";
import { attendancePageDate } from "@/lib/attendance-page";
export const metadata = { title: "Attendance" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return <BusinessAttendance initialDate={attendancePageDate(query.date)} initialTab={typeof query.tab === "string" ? query.tab : undefined} />;
}
