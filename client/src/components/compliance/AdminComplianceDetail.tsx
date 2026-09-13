"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Download, FileText, HeartPulse, Landmark, LoaderCircle, PencilLine, RotateCcw, Save, ShieldCheck, UserRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  downloadAdminCompliance,
  getEsicCompliance,
  getPfCompliance,
  reviewEsicCompliance,
  reviewPfCompliance,
  updateEsicCompliance,
  updatePfCompliance,
  type EsicComplianceDetail,
  type PfComplianceDetail,
} from "@/services/admin-compliance.service";
import { getCurrentUser } from "@/services/auth.service";
import type { AdminPermission } from "@/types/auth.types";
import type { ComplianceHistoryItem } from "@/types/compliance.types";
import "@/styles/compliance.css";

const label = (value: string) => value.split("_").map(word => word[0] + word.slice(1).toLowerCase()).join(" ");
const actionLabel = (action: string) => action.replace(/^employee_compliance\./, "").split("_").map(word => word[0]?.toUpperCase() + word.slice(1)).join(" ");
function Fact({ label: title, value }: { label: string; value: string | number | boolean | null | undefined }) { return <div><dt>{title}</dt><dd>{value === null || value === undefined || value === "" ? "—" : String(value)}</dd></div>; }
function money(value: string) { return value === "" ? null : Math.max(0, Math.round(Number(value) || 0)); }
function address(value: { line1: string; line2: string; city: string; state: string; postalCode: string }) { return [value.line1, value.line2, value.city, value.state, value.postalCode].filter(Boolean).join(", "); }
function historyActor(item: ComplianceHistoryItem) { return item.actor?.email || "Employee"; }

export function AdminComplianceDetail({ area, id }: { area: "pf" | "esic"; id: string }) {
  const [data, setData] = useState<PfComplianceDetail | EsicComplianceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [remarks, setRemarks] = useState("");
  const [permissions, setPermissions] = useState<Set<AdminPermission>>(new Set());
  const [pfEdit, setPfEdit] = useState({ appointmentDate: "", epfWages: null as number | null, monthlyGross: null as number | null, department: "", designation: "", bankAccountType: "" as "" | "SAVINGS" | "CURRENT", existingUanNumber: "" });
  const [esicEdit, setEsicEdit] = useState({ esiApplicable: false, esiNumber: "" });

  const load = useCallback(async () => {
    try {
      const response = area === "pf" ? await getPfCompliance(id) : await getEsicCompliance(id);
      setData(response.data);
      if (area === "pf") {
        const pf = (response.data as PfComplianceDetail).pf;
        if (pf) setPfEdit({
          appointmentDate: pf.appointmentDate || "",
          epfWages: pf.epfWages,
          monthlyGross: pf.monthlyGross,
          department: pf.department || "",
          designation: pf.designation || "",
          bankAccountType: (pf.bankAccountType as "" | "SAVINGS" | "CURRENT") || "",
          existingUanNumber: pf.existingUanNumber || "",
        });
      } else {
        const esic = (response.data as EsicComplianceDetail).esic;
        if (esic) setEsicEdit({ esiApplicable: Boolean(esic.esiApplicable), esiNumber: esic.esiNumber || "" });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load compliance record.");
    } finally {
      setLoading(false);
    }
  }, [area, id]);

  useEffect(() => {
    let active = true;
    const request = area === "pf" ? getPfCompliance(id) : getEsicCompliance(id);

    void request
      .then(response => {
        if (!active) return;
        setError("");
        setData(response.data);

        if (area === "pf") {
          const pf = (response.data as PfComplianceDetail).pf;
          if (pf) {
            setPfEdit({
              appointmentDate: pf.appointmentDate || "",
              epfWages: pf.epfWages,
              monthlyGross: pf.monthlyGross,
              department: pf.department || "",
              designation: pf.designation || "",
              bankAccountType: (pf.bankAccountType as "" | "SAVINGS" | "CURRENT") || "",
              existingUanNumber: pf.existingUanNumber || "",
            });
          }
        } else {
          const esic = (response.data as EsicComplianceDetail).esic;
          if (esic) {
            setEsicEdit({ esiApplicable: Boolean(esic.esiApplicable), esiNumber: esic.esiNumber || "" });
          }
        }
      })
      .catch(err => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Unable to load compliance record.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [area, id]);
  useEffect(() => {
    let active = true;
    void getCurrentUser().then(response => { if (active) setPermissions(new Set(response.data.user.adminPermissions ?? [])); }).catch(() => { if (active) setPermissions(new Set()); });
    return () => { active = false; };
  }, []);

  const record = area === "pf" ? (data as PfComplianceDetail | null)?.pf : (data as EsicComplianceDetail | null)?.esic;
  const canVerify = permissions.has(area === "pf" ? "PF_VERIFY" : "ESIC_VERIFY");
  const canUpdate = permissions.has(area === "pf" ? "PF_UPDATE" : "ESIC_UPDATE");
  const updateAllowed = record?.status === "UNDER_REVIEW" || record?.status === "VERIFIED";

  async function transition(status: "UNDER_REVIEW" | "NEEDS_CORRECTION" | "VERIFIED" | "PROCESSED") {
    if (!record || !canVerify) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (area === "pf") await reviewPfCompliance(id, { status, remarks, expectedRevision: record.revision });
      else await reviewEsicCompliance(id, { status, remarks, expectedRevision: record.revision });
      setMessage(`${area === "pf" ? "PF / EPFO" : "ESIC"} status updated to ${label(status)}.`);
      setRemarks("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update compliance status.");
    } finally { setBusy(false); }
  }

  async function saveDepartmentFields() {
    if (!record || !canUpdate || !updateAllowed) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (area === "pf") {
        await updatePfCompliance(id, { ...pfEdit, expectedRevision: record.revision });
      } else {
        await updateEsicCompliance(id, { ...esicEdit, expectedRevision: record.revision });
      }
      setMessage(`${area === "pf" ? "PF / EPFO" : "ESIC"} department-controlled fields saved. The record remains under review until verified.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save department-controlled fields.");
    } finally { setBusy(false); }
  }

  async function download(documentId: string, fileName: string) {
    try { await downloadAdminCompliance(`/admin/compliance/${area}/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`, fileName); }
    catch (err) { setError(err instanceof Error ? err.message : "Download failed."); }
  }

  if (loading) return <div className="zhr-admin-loading"><LoaderCircle className="zhr-spin" />Loading compliance record…</div>;
  if (!data) return <div className="zhr-admin-error">{error || "Compliance record not found."}</div>;

  const employee = data.employee;
  const Icon = area === "pf" ? Landmark : HeartPulse;
  const docs = data.documents;
  const history = data.history;
  const pf = area === "pf" ? (data as PfComplianceDetail).pf : null;
  const esic = area === "esic" ? (data as EsicComplianceDetail).esic : null;
  const canStart = record?.status === "SUBMITTED" || record?.status === "RESUBMITTED";
  const canReview = record?.status === "UNDER_REVIEW";
  const canProcess = record?.status === "VERIFIED";

  return <div className="zhr-admin">
    <nav className="zhr-admin-nav"><Link href={`/admin/compliance/${area}`}><ArrowLeft />All {area === "pf" ? "PF / EPFO" : "ESIC"} records</Link></nav>
    <header className="zhr-admin-detail-head"><span className="zhr-admin-avatar"><Icon /></span><div><p className="zhr-admin-kicker">{employee.employeeNumber}</p><h1>{employee.fullName}</h1><p>{employee.projectAssignment}</p></div><span className={`zcomp-status is-${(record?.status || "draft").toLowerCase()}`}>{record ? label(record.status) : "Not submitted"}</span></header>
    {message && <div className="zhr-admin-success"><BadgeCheck />{message}</div>}
    {error && <div className="zhr-admin-error">{error}</div>}

    <div className="zcomp-admin-detail">
      <div className="zhr-admin-detail-main">
        <section className="zcomp-admin-panel"><h2><UserRound size={18} /> Employee master record</h2><dl className="zcomp-facts">
          <Fact label="Employee ID" value={employee.employeeNumber} /><Fact label="Email" value={employee.personalEmail} /><Fact label="Phone" value={employee.phone} /><Fact label="Date of birth" value={employee.dateOfBirth} /><Fact label="Gender" value={employee.gender} /><Fact label="Father / guardian" value={employee.fatherGuardianName} /><Fact label="Aadhaar" value={employee.aadhaarNumber} /><Fact label="Project" value={employee.projectAssignment} /><Fact label="Present address" value={address(employee.currentAddress)} /><Fact label="Permanent address" value={address(employee.permanentAddress)} /><Fact label="Employee photo" value={employee.employeePhotoAvailable ? "Available in secure joining record" : "Not attached"} />
          {area === "pf" && <><Fact label="PAN" value={employee.panNumber} /><Fact label="Bank" value={employee.bankName} /><Fact label="Bank account" value={employee.bankAccountNumber} /><Fact label="IFSC" value={employee.ifscCode} /><Fact label="Master UAN" value={employee.uanNumber} /></>}
        </dl></section>

        {pf && <section className="zcomp-admin-panel"><h2><Landmark size={18} /> PF / EPFO record</h2><dl className="zcomp-facts"><Fact label="Appointment date" value={pf.appointmentDate} /><Fact label="Department" value={pf.department} /><Fact label="Designation" value={pf.designation} /><Fact label="Monthly gross" value={pf.monthlyGross} /><Fact label="EPF wages" value={pf.epfWages} /><Fact label="Existing UAN" value={pf.existingUanNumber || employee.uanNumber} /><Fact label="Present district" value={pf.presentDistrict} /><Fact label="Permanent district" value={pf.permanentDistrict} /><Fact label="Account type" value={pf.bankAccountType} /><Fact label="Husband's name" value={pf.husbandName} /></dl></section>}

        {esic && <><section className="zcomp-admin-panel"><h2><HeartPulse size={18} /> ESIC record</h2><dl className="zcomp-facts"><Fact label="ESIC applicable" value={esic.esiApplicable === null ? "Not confirmed" : esic.esiApplicable ? "Yes" : "No"} /><Fact label="Existing ESI number" value={esic.esiNumber} /><Fact label="Nominee" value={esic.nomineeName} /><Fact label="Relationship" value={esic.nomineeRelationship} /><Fact label="Nominee mobile" value={esic.nomineeMobile} /><Fact label="Nominee email" value={esic.nomineeEmail} /><Fact label="Nominee address" value={esic.nomineeAddress} /><Fact label="Family members" value={esic.familyMembers.length} /></dl></section>{esic.familyMembers.map((member, index) => <section className="zcomp-admin-panel" key={member.id || index}><h2>Family member {index + 1}: {member.nameAsAadhaar}</h2><dl className="zcomp-facts"><Fact label="Relationship" value={member.relationship} /><Fact label="Date of birth" value={member.dateOfBirth} /><Fact label="Aadhaar" value={member.aadhaarNumber} /><Fact label="Residing with employee" value={member.residesWithEmployee ? "Yes" : "No"} /><Fact label="Address" value={member.residesWithEmployee ? "Same as employee" : member.address} /></dl></section>)}</>}

        <section className="zcomp-admin-panel"><h2><FileText size={18} /> Compliance documents</h2><div className="zcomp-doc-list">{docs.length ? docs.map(document => <button type="button" key={document.id} onClick={() => void download(document.id, document.fileName)}><span><strong>{label(document.kind)}</strong><br /><small>{document.fileName} · {(document.size / 1024 / 1024).toFixed(2)} MB</small></span><Download size={17} /></button>) : <p>No department-specific documents attached. Employee Joining source documents stay in the HR record.</p>}</div></section>

        <section className="zcomp-admin-panel"><h2><FileText size={18} /> Compliance history</h2>{history.length ? <div className="zcomp-history">{history.map(item => <div className="zcomp-history-item" key={item.id}><span /><div><strong>{actionLabel(item.action)}</strong><small>{historyActor(item)} · {new Date(item.createdAt).toLocaleString("en-IN")}</small></div></div>)}</div> : <p>No compliance events have been recorded yet.</p>}</section>
      </div>

      <aside>
        <section className="zcomp-admin-panel"><h2><ShieldCheck size={18} /> Department review</h2>{!record ? <p>The employee has not started this compliance form yet.</p> : <><p>Current status: <strong>{label(record.status)}</strong></p>{canVerify ? <div className="zcomp-review-actions">{canStart && <button disabled={busy} onClick={() => void transition("UNDER_REVIEW")}><BadgeCheck size={17} />Start review</button>}{canReview && <><textarea rows={4} maxLength={3000} placeholder="Correction remarks (required when requesting correction)" value={remarks} onChange={event => setRemarks(event.target.value)} /><button className="secondary" disabled={busy || remarks.trim().length < 8} onClick={() => void transition("NEEDS_CORRECTION")}><RotateCcw size={17} />Request correction</button><button disabled={busy} onClick={() => void transition("VERIFIED")}><BadgeCheck size={17} />Verify record</button></>}{canProcess && <button disabled={busy} onClick={() => void transition("PROCESSED")}><BadgeCheck size={17} />Mark processed</button>}{!canStart && !canReview && !canProcess && <p>No department action is available at this status.</p>}</div> : <p>Your account has view-only access to this compliance desk.</p>}</>}</section>

        {record && canUpdate && updateAllowed && area === "pf" && <section className="zcomp-admin-panel"><h2><PencilLine size={18} /> PF-controlled fields</h2><p className="zcomp-panel-copy">Editing a verified record moves it back to Under Review so the changed values must be verified again.</p><div className="zcomp-admin-edit"><label><span>Appointment date</span><input type="date" value={pfEdit.appointmentDate} onChange={event => setPfEdit(value => ({ ...value, appointmentDate: event.target.value }))} /></label><label><span>Department</span><input maxLength={140} value={pfEdit.department} onChange={event => setPfEdit(value => ({ ...value, department: event.target.value }))} /></label><label><span>Designation</span><input maxLength={140} value={pfEdit.designation} onChange={event => setPfEdit(value => ({ ...value, designation: event.target.value }))} /></label><label><span>Monthly gross</span><input type="number" min={0} value={pfEdit.monthlyGross ?? ""} onChange={event => setPfEdit(value => ({ ...value, monthlyGross: money(event.target.value) }))} /></label><label><span>EPF wages</span><input type="number" min={0} value={pfEdit.epfWages ?? ""} onChange={event => setPfEdit(value => ({ ...value, epfWages: money(event.target.value) }))} /></label><label><span>Existing UAN</span><input inputMode="numeric" maxLength={12} value={pfEdit.existingUanNumber} onChange={event => setPfEdit(value => ({ ...value, existingUanNumber: event.target.value.replace(/\D/g, "").slice(0, 12) }))} /></label><label><span>Bank account type</span><select value={pfEdit.bankAccountType} onChange={event => setPfEdit(value => ({ ...value, bankAccountType: event.target.value as "" | "SAVINGS" | "CURRENT" }))}><option value="">Select</option><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option></select></label><button type="button" disabled={busy} onClick={() => void saveDepartmentFields()}><Save size={17} />Save PF fields</button></div></section>}

        {record && canUpdate && updateAllowed && area === "esic" && <section className="zcomp-admin-panel"><h2><PencilLine size={18} /> ESIC-controlled fields</h2><p className="zcomp-panel-copy">Only ESIC applicability and the official insurance number are department-maintained here. Employee nominee/family declarations remain employee-supplied.</p><div className="zcomp-admin-edit"><label><span>ESIC applicable</span><select value={esicEdit.esiApplicable ? "YES" : "NO"} onChange={event => setEsicEdit(value => ({ ...value, esiApplicable: event.target.value === "YES" }))}><option value="YES">Yes</option><option value="NO">No</option></select></label><label><span>Existing / allotted ESI number</span><input inputMode="numeric" maxLength={20} value={esicEdit.esiNumber} onChange={event => setEsicEdit(value => ({ ...value, esiNumber: event.target.value.replace(/\D/g, "").slice(0, 20) }))} /></label><button type="button" disabled={busy} onClick={() => void saveDepartmentFields()}><Save size={17} />Save ESIC fields</button></div></section>}
      </aside>
    </div>
  </div>;
}
