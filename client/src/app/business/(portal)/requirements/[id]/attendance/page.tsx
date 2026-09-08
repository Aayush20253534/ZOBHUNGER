import { BusinessAttendance } from "@/components/business/attendance/AttendanceWorkspace";
import { attendancePageDate } from "@/lib/attendance-page";
export const metadata = { title: "Requirement attendance" };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <BusinessAttendance requirementId={id} initialDate={attendancePageDate(query.date)} />;
}
