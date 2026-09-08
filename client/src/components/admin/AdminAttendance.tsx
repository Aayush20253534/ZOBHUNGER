"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/services/auth.service";
import { useBusinessResource } from "@/components/business/BusinessDashboardUI";
import { AttendanceWorkspace } from "@/components/business/attendance/AttendanceWorkspace";
import { AssignmentCalendar } from "@/components/business/attendance/AssignmentCalendar";
import { AttendanceError, AttendanceLoading } from "@/components/business/attendance/AttendanceUI";
import "@/styles/business.css";
import "@/styles/business-attendance.css";

export function AdminAttendance({ id, initialDate, initialTab }: { id?: string; initialDate?: string; initialTab?: string }) {
  const [version, setVersion] = useState(0); const request = useCallback(() => getCurrentUser(), []);
  const { data, error, loading } = useBusinessResource(`attendance-admin:${version}`, request);
  return <div className="zb-biz zb-att zb-att-admin"><Link className="zb-biz-text-link" href="/admin"><ArrowLeft aria-hidden="true" />Operations dashboard</Link>{loading ? <AttendanceLoading /> : error ? <AttendanceError admin error={error} retry={() => setVersion(v => v + 1)} /> : data?.user.role !== "ADMIN" ? <AttendanceError admin error={new ApiError("Use your administrator account to manage assignments and attendance.", 403)} retry={() => setVersion(v => v + 1)} /> : id ? <AssignmentCalendar key={`${data.user.id}:${id}`} admin id={id} accountId={data.user.id} initialDate={initialDate} /> : <AttendanceWorkspace key={data.user.id} admin accountId={data.user.id} initialDate={initialDate} initialTab={initialTab} />}</div>;
}
