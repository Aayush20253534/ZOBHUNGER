"use client";
import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, FileCheck2, RefreshCw } from "lucide-react";
import { getCurrentUser } from "@/services/auth.service";
import { ApiError } from "@/lib/api";
import { useBusinessResource } from "../BusinessDashboardUI";
import { DeploymentError } from "../deployments/DeploymentUI";
import { AttendanceLoading, AttendancePages } from "../attendance/AttendanceUI";
import "@/styles/business.css";
import "@/styles/business-attendance.css";
import "@/styles/business-phase2.css";
export { AttendanceLoading as Loading, AttendancePages as Pages, DeploymentError as ErrorState };
export const words = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, char => char.toUpperCase());
export function Badge({ value }: { value: string }) { return <span className="zb-p2-badge" data-status={value}>{words(value)}</span>; }
export function Heading({ eyebrow, title, children, action }: { eyebrow: string; title: string; children: ReactNode; action?: ReactNode }) {
  return <header className="zb-p2-heading"><div><p className="zb-biz-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{children}</p></div>{action && <div className="zb-p2-actions">{action}</div>}</header>;
}
export function Refresh({ loading, onClick }: { loading: boolean; onClick: () => void }) { return <button type="button" className="zb-att-icon-button" disabled={loading} onClick={onClick} aria-label="Refresh this view"><RefreshCw aria-hidden="true" /></button>; }
export function Empty({ title, children }: { title: string; children: ReactNode }) { return <div className="zb-att-empty"><FileCheck2 aria-hidden="true" /><h2>{title}</h2><p>{children}</p></div>; }
export function AdminGate({ children }: { children: (id: string) => ReactNode }) {
  const [version, setVersion] = useState(0); const request = useCallback(() => getCurrentUser(), []);
  const { data, error, loading } = useBusinessResource(`phase2-admin:${version}`, request);
  return <main className="zb-biz zb-att zb-p2 zb-att-admin"><Link className="zb-biz-text-link" href="/admin"><ArrowLeft aria-hidden="true" />Operations dashboard</Link>{loading ? <AttendanceLoading /> : error ? <DeploymentError admin error={error} retry={() => setVersion(v => v + 1)} /> : data?.user.role !== "ADMIN" ? <DeploymentError admin error={new ApiError("Use your administrator account.", 403)} retry={() => setVersion(v => v + 1)} /> : children(data.user.id)}</main>;
}
