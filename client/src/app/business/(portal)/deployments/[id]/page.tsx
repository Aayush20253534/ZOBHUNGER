import { BusinessDeployment } from "@/components/business/deployments/DeploymentDetail";
import { attendancePageDate } from "@/lib/attendance-page";
export const metadata = { title: "Assignment details" };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <BusinessDeployment id={id} initialDate={attendancePageDate(query.date)} />;
}
