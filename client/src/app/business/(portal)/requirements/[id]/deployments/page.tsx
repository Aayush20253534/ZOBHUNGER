import { BusinessDeployments } from "@/components/business/deployments/DeploymentWorkspace";
import { attendancePageDate } from "@/lib/attendance-page";
export const metadata = { title: "Requirement team roster" };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <BusinessDeployments requirementId={id} initialDate={attendancePageDate(query.date)} initialView={typeof query.view === "string" ? query.view : undefined} />;
}
