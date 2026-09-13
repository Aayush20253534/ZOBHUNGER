"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BadgeCheck, FileCheck2, HeartPulse, IdCard, Landmark, LoaderCircle, LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import { clearComplianceToken, complianceToken, createEmployeeComplianceAccess, getEmployeeComplianceProfile, storeComplianceToken } from "@/services/compliance.service";
import type { ComplianceStatus, EmployeeComplianceProfile } from "@/types/compliance.types";

function statusLabel(status?: ComplianceStatus | null) {
  if (!status) return "Not submitted";
  return status.split("_").map(word => word[0] + word.slice(1).toLowerCase()).join(" ");
}

export function EmployeeComplianceLanding() {
  const [profile, setProfile] = useState<EmployeeComplianceProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(complianceToken()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [identity, setIdentity] = useState({ employeeNumber: "", personalEmail: "", dateOfBirth: "", aadhaarLast4: "" });

  const load = useCallback(async () => {
    if (!complianceToken()) { setLoading(false); return; }
    try {
      const response = await getEmployeeComplianceProfile();
      setProfile(response.data);
    } catch (err) {
      clearComplianceToken();
      setProfile(null);
      if (err instanceof ApiError && err.status !== 401) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await createEmployeeComplianceAccess(identity);
      storeComplianceToken(response.data.token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to verify this employee record.");
    } finally { setBusy(false); }
  }

  if (loading) return <div className="zhr-shell zcomp-loading"><LoaderCircle className="zhr-spin" /> Loading compliance workspace…</div>;

  return <div className="zhr-shell">
    <header className="zhr-header"><div className="zhr-brand"><div className="zhr-wordmark"><div className="zhr-wordmark-name"><span>ZOB</span><b>HUNGER</b></div><div className="zhr-wordmark-tagline">Hire. Deploy. Deliver.</div></div><span className="zhr-brand-divider" /><span className="zhr-brand-context">Employee compliance</span></div><div className="zhr-secure"><LockKeyhole /><div><strong>Private compliance workspace</strong><span>PF / EPFO and ESIC records</span></div></div></header>
    {!profile ? <main className="zcomp-access-wrap"><section className="zcomp-access-card"><div className="zcomp-access-icon"><ShieldCheck /></div><p className="zhr-kicker">SECURE EMPLOYEE ACCESS</p><h1>Open your compliance record.</h1><p>Verify the same details used in your Employee Joining record. No department or government-portal password is required.</p>{error && <div className="zhr-alert zhr-alert--error"><strong>Unable to continue.</strong><span>{error}</span></div>}<form className="zcomp-access-form" onSubmit={verify}>
      <label className="zhr-field"><span>Employee ID *</span><input required maxLength={80} placeholder="ZBH-..." value={identity.employeeNumber} onChange={e => setIdentity(v => ({ ...v, employeeNumber: e.target.value.toUpperCase() }))} /></label>
      <label className="zhr-field"><span>Registered email *</span><input required type="email" value={identity.personalEmail} onChange={e => setIdentity(v => ({ ...v, personalEmail: e.target.value }))} /></label>
      <label className="zhr-field"><span>Date of birth *</span><input required type="date" value={identity.dateOfBirth} onChange={e => setIdentity(v => ({ ...v, dateOfBirth: e.target.value }))} /></label>
      <label className="zhr-field"><span>Last 4 digits of Aadhaar *</span><input required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={identity.aadhaarLast4} onChange={e => setIdentity(v => ({ ...v, aadhaarLast4: e.target.value.replace(/\D/g, "").slice(0,4) }))} /></label>
      <button className="zhr-button zhr-button--submit" type="submit" disabled={busy}>{busy ? <LoaderCircle className="zhr-spin" /> : <BadgeCheck />}{busy ? "Verifying…" : "Verify & continue"}</button>
    </form></section></main> : <main className="zcomp-workspace">
      <section className="zcomp-hero"><div><p className="zhr-kicker">EMPLOYEE COMPLIANCE · {profile.employee.employeeNumber}</p><h1>{profile.employee.fullName}</h1><p>Complete statutory records once. Existing joining information is securely prefilled from your master employee record.</p></div><button type="button" onClick={() => { clearComplianceToken(); setProfile(null); }}><LogOut />End session</button></section>
      {error && <div className="zhr-alert zhr-alert--error"><strong>Something needs attention.</strong><span>{error}</span></div>}
      <section className="zcomp-summary"><div><IdCard /><span><small>Employee ID</small><strong>{profile.employee.employeeNumber}</strong></span></div><div><FileCheck2 /><span><small>Assignment</small><strong>{profile.employee.projectAssignment}</strong></span></div><div><ShieldCheck /><span><small>Master record</small><strong>Verified</strong></span></div></section>
      <section className="zcomp-cards">
        <Link href="/employee-compliance/pf" className="zcomp-card"><span className="zcomp-card-icon"><Landmark /></span><div><p>PF / EPFO</p><h2>Provident Fund details</h2><span className={`zcomp-status is-${(profile.pf?.status || "draft").toLowerCase()}`}>{statusLabel(profile.pf?.status)}</span>{profile.pf?.correctionRemarks && <small>{profile.pf.correctionRemarks}</small>}</div><b>Open PF details →</b></Link>
        <Link href="/employee-compliance/esic" className="zcomp-card"><span className="zcomp-card-icon"><HeartPulse /></span><div><p>ESIC</p><h2>ESI & family details</h2><span className={`zcomp-status is-${(profile.esic?.status || "draft").toLowerCase()}`}>{statusLabel(profile.esic?.status)}</span>{profile.esic?.correctionRemarks && <small>{profile.esic.correctionRemarks}</small>}</div><b>Open ESIC details →</b></Link>
      </section>
    </main>}
  </div>;
}
