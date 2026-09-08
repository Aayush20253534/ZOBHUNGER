"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/services/auth.service";
import { useBusinessResource } from "@/components/business/BusinessDashboardUI";
import { AttendanceLoading } from "@/components/business/attendance/AttendanceUI";
import { DeploymentWorkspace } from "@/components/business/deployments/DeploymentWorkspace";
import { DeploymentDetail } from "@/components/business/deployments/DeploymentDetail";
import { DeploymentError } from "@/components/business/deployments/DeploymentUI";
import "@/styles/business.css";

export function AdminDeployments({ id, requirementId, initialDate, initialView }: { id?: string; requirementId?: string; initialDate?: string; initialView?: string }) {
  const [version, setVersion] = useState(0); const request = useCallback(() => getCurrentUser(), []);
  const { data, error, loading } = useBusinessResource(`deployments-admin:${version}`, request);
  return <div className="zb-biz zb-att zb-deploy zb-att-admin"><Link className="zb-biz-text-link" href="/admin"><ArrowLeft aria-hidden="true" />Operations dashboard</Link>{loading ? <AttendanceLoading /> : error ? <DeploymentError admin error={error} retry={() => setVersion(v => v + 1)} /> : data?.user.role !== "ADMIN" ? <DeploymentError admin error={new ApiError("Use your administrator account to manage deployments.", 403)} retry={() => setVersion(v => v + 1)} /> : id ? <DeploymentDetail key={`${data.user.id}:${id}`} admin accountId={data.user.id} id={id} initialDate={initialDate} /> : <DeploymentWorkspace key={`${data.user.id}:${requirementId ?? "all"}`} admin accountId={data.user.id} requirementId={requirementId} initialDate={initialDate} initialView={initialView} />}</div>;
}
