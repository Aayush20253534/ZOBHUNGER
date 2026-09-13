"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, HeartPulse, Landmark, LoaderCircle, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  complianceQuery,
  downloadAdminCompliance,
  listEsicCompliance,
  listPfCompliance,
  type CompliancePage,
  type EsicComplianceListItem,
  type PfComplianceListItem,
} from "@/services/admin-compliance.service";
import { getCurrentUser } from "@/services/auth.service";
import type { ComplianceStatus } from "@/types/compliance.types";
import "@/styles/compliance.css";

const statuses: Array<ComplianceStatus | ""> = ["", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_CORRECTION", "RESUBMITTED", "VERIFIED", "PROCESSED"];
const label = (value: string) => value ? value.split("_").map(word => word[0] + word.slice(1).toLowerCase()).join(" ") : "All statuses";
const n = (value: number | undefined) => value ?? 0;

export function AdminComplianceDesk({ area }: { area: "pf" | "esic" }) {
  const [data, setData] = useState<CompliancePage<PfComplianceListItem> | CompliancePage<EsicComplianceListItem> | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ComplianceStatus | "">("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canExport, setCanExport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = area === "pf"
        ? await listPfCompliance({ page, query, status, department })
        : await listEsicCompliance({ page, query, status });
      setData(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load compliance records.");
    } finally {
      setLoading(false);
    }
  }, [area, page, query, status, department]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 220 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  useEffect(() => {
    let active = true;
    void getCurrentUser().then(response => {
      if (!active) return;
      const granted = new Set(response.data.user.adminPermissions ?? []);
      setCanExport(granted.has(area === "pf" ? "PF_EXPORT" : "ESIC_EXPORT"));
    }).catch(() => { if (active) setCanExport(false); });
    return () => { active = false; };
  }, [area]);

  const stats = useMemo(() => data?.stats, [data]);
  const Icon = area === "pf" ? Landmark : HeartPulse;
  const title = area === "pf" ? "PF / EPFO Compliance" : "ESIC Compliance";

  async function exportRows() {
    if (!canExport) return;
    try {
      const params = area === "pf" ? { query, status, department } : { query, status };
      const suffix = complianceQuery(params);
      await downloadAdminCompliance(
        `/admin/compliance/${area}/export.xlsx?${suffix}`,
        area === "pf" ? "zobhunger-pf-epfo-compliance.xlsx" : "zobhunger-esic-compliance.xlsx",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    }
  }

  return <div className="zhr-admin">
    <section className="zcomp-form-hero">
      <div>
        <p className="zhr-admin-kicker">COMPLIANCE MANAGEMENT</p>
        <h1>{title}</h1>
        <p>{area === "pf" ? "Verify provident-fund records, request employee corrections and export the client’s Excel-compatible dataset." : "Review ESIC applicability, nominee and family details in a department-scoped workspace."}</p>
      </div>
      <span className="zcomp-card-icon"><Icon /></span>
    </section>
    {error && <div className="zhr-admin-error">{error}</div>}
    <div className="zcomp-admin-stats">
      <div className="zcomp-admin-stat"><small>Total employees</small><strong>{n(stats?.totalEmployees)}</strong></div>
      <div className="zcomp-admin-stat"><small>Pending submission</small><strong>{n(stats?.pendingSubmission)}</strong></div>
      <div className="zcomp-admin-stat"><small>Needs correction</small><strong>{n(stats?.byStatus.NEEDS_CORRECTION)}</strong></div>
      <div className="zcomp-admin-stat"><small>Verified / processed</small><strong>{n(stats?.byStatus.VERIFIED) + n(stats?.byStatus.PROCESSED)}</strong></div>
    </div>
    <div className="zcomp-admin-toolbar">
      <label><Search size={16} /><input value={query} placeholder="Employee ID, name or email" onChange={event => { setPage(1); setQuery(event.target.value); }} /></label>
      <select value={status} onChange={event => { setPage(1); setStatus(event.target.value as ComplianceStatus | ""); }}>{statuses.map(item => <option key={item || "all"} value={item}>{label(item)}</option>)}</select>
      {area === "pf" && <input placeholder="Department" value={department} onChange={event => { setPage(1); setDepartment(event.target.value); }} />}
      <button type="button" onClick={() => void load()}><RefreshCw size={16} />Refresh</button>
      {canExport && <button type="button" onClick={() => void exportRows()}><Download size={16} />Export filtered Excel</button>}
    </div>
    <div className="zcomp-table-wrap">
      <table className="zcomp-table">
        <thead><tr><th>Employee</th><th>Assignment</th><th>{area === "pf" ? "Department / designation" : "ESIC applicability"}</th><th>{area === "pf" ? "UAN" : "ESI number"}</th><th>{area === "esic" ? "Family" : "Identifier"}</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead>
        <tbody>{loading
          ? <tr><td colSpan={8}><LoaderCircle className="zhr-spin" /> Loading records…</td></tr>
          : data?.items.length
            ? data.items.map(item => {
              const pf = area === "pf" ? item as PfComplianceListItem : null;
              const esic = area === "esic" ? item as EsicComplianceListItem : null;
              const statusValue = pf?.pfCompliance?.status || esic?.esicCompliance?.status;
              const updatedAt = pf?.pfCompliance?.updatedAt || esic?.esicCompliance?.updatedAt;
              return <tr key={item.id}>
                <td><strong>{item.fullName}</strong><br /><small>{item.employeeNumber}<br />{item.personalEmail}</small></td>
                <td>{item.projectAssignment}</td>
                <td>{pf ? `${pf.pfCompliance?.department || "—"} · ${pf.pfCompliance?.designation || "—"}` : esic?.esicCompliance?.esiApplicable === null || esic?.esicCompliance?.esiApplicable === undefined ? "Not submitted" : esic.esicCompliance.esiApplicable ? "Applicable" : "Not applicable"}</td>
                <td>{pf?.uan || esic?.esiNumber || "—"}</td>
                <td>{esic ? `${esic.esicCompliance?._count.familyMembers ?? 0} member(s)` : pf?.aadhaar}</td>
                <td><span className={`zcomp-status is-${(statusValue || "draft").toLowerCase()}`}>{statusValue ? label(statusValue) : "Not submitted"}</span></td>
                <td>{updatedAt ? new Date(updatedAt).toLocaleDateString("en-IN") : "—"}</td>
                <td><Link href={`/admin/compliance/${area}/${item.id}`}>Open record</Link></td>
              </tr>;
            })
            : <tr><td colSpan={8}><ShieldCheck size={18} /> No matching compliance records.</td></tr>}</tbody>
      </table>
    </div>
    {data && data.totalPages > 1 && <div className="zhr-admin-pagination"><button disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {data.totalPages}</span><button disabled={page >= data.totalPages || loading} onClick={() => setPage(value => value + 1)}>Next</button></div>}
  </div>;
}
