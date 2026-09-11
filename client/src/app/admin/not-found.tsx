import { SearchX } from "lucide-react";
import { AdminRouteState } from "@/components/admin/AdminRouteState";

export default function AdminNotFound() {
  return <AdminRouteState icon={SearchX} eyebrow="Workspace not found" title="That admin desk does not exist." description="The address may be outdated, or the workspace may have moved. Use your department overview to continue from an assigned area." />;
}
