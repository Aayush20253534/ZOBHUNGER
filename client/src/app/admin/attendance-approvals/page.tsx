import { AdminApprovals } from "@/components/business/phase2/AttendanceApprovals";
export const metadata = { title: "Attendance approval history", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function Page() { return <AdminApprovals />; }
