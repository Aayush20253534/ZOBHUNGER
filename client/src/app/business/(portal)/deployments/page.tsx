import { BusinessDeployments } from "@/components/business/deployments/DeploymentWorkspace";
import { attendancePageDate } from "@/lib/attendance-page";
export const metadata = { title: "Deployment & team roster" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return <BusinessDeployments initialDate={attendancePageDate(query.date)} initialView={typeof query.view === "string" ? query.view : undefined} />;
}
