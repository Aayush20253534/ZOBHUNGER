import { AdminDeployments } from "@/components/admin/AdminDeployments";
import { attendancePageDate } from "@/lib/attendance-page";
export const metadata = { title: "Deployments & team roster | ZOBHUNGER", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return <AdminDeployments requirementId={typeof query.requirementId === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(query.requirementId) ? query.requirementId : undefined} initialDate={attendancePageDate(query.date)} initialView={typeof query.view === "string" ? query.view : undefined} />;
}
