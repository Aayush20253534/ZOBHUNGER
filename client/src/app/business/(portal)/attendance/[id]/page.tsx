import { BusinessAssignment } from "@/components/business/attendance/AssignmentCalendar";
import { attendancePageDate } from "@/lib/attendance-page";
export const metadata = { title: "Assignment attendance" };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <BusinessAssignment id={id} initialDate={attendancePageDate(query.date)} />;
}
