"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, CheckCircle2, ClipboardCheck, Download, FileText, Handshake, Inbox, Mail, MapPin, PauseCircle, Phone, RefreshCw, Search, ShieldCheck, UsersRound, XCircle } from "lucide-react";
import { ApiError, apiFieldErrors } from "@/lib/api";
import { getCurrentUser } from "@/services/auth.service";
import { getVendor, listVendors, reviewVendor, updateVendorRecord } from "@/services/vendors.service";
import { vendorCategories, vendorCategoryLabel, vendorDocumentLabel, vendorOrganizations, vendorStatusLabel } from "@/data/vendors";
import type { VendorDetail, VendorList, VendorRecordInput, VendorStatus } from "@/types/vendor.types";
import "@/styles/admin-intake.css";
import "@/styles/vendors.css";

const date = (value: string | null) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not yet submitted";
function errorText(error: unknown) { const fields = Object.entries(apiFieldErrors(error)).map(([field, messages]) => field + ": " + messages.join(" ")).join(" · "); return fields || (error instanceof Error ? error.message : "The request could not be completed."); }
function Badge({ status }: { status: VendorStatus }) { return <span className="zb-review-badge" data-status={status}>{vendorStatusLabel(status)}</span>; }
function Block({ title, icon: Icon, children }: { title: string; icon: typeof FileText; children: ReactNode }) { return <section className="zb-review-block"><h2><Icon aria-hidden="true" />{title}</h2>{children}</section>; }
const decisions: Record<VendorStatus, Exclude<VendorStatus, "DRAFT" | "SUBMITTED">[]> = { DRAFT: [], SUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED"], UNDER_REVIEW: ["UNDER_REVIEW", "APPROVED", "REJECTED"], APPROVED: ["APPROVED", "SUSPENDED"], REJECTED: ["UNDER_REVIEW", "REJECTED"], SUSPENDED: ["APPROVED", "SUSPENDED"] };

function VendorRecordForm({ application, onSaved }: { application: VendorDetail; onSaved: (item: VendorDetail) => void }) {
  const [record, setRecord] = useState<VendorRecordInput>({ contactName: application.contactName, contactRole: application.contactRole, email: application.email, phone: application.phone, alternatePhone: application.alternatePhone ?? "", website: application.website ?? "", teamSize: application.teamSize, coverage: application.coverage, capacityNotes: application.capacityNotes ?? "", accountManager: application.accountManager ?? "", internalNotes: application.internalNotes ?? "" });
  const [coverage, setCoverage] = useState(application.coverage.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function set<K extends keyof VendorRecordInput>(key: K, value: VendorRecordInput[K]) { setRecord(current => ({ ...current, [key]: value })); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { const response = await updateVendorRecord(application.id, application.revision, { ...record, coverage: coverage.split(",").map(item => item.trim()).filter(Boolean) }); onSaved(response.data.application); }
    catch (caught) { setError(errorText(caught)); } finally { setBusy(false); }
  }
  return <details className="zb-vendor-record-editor"><summary><Building2 aria-hidden="true" />Maintain vendor record</summary><p>Keep contact details, capacity, coverage and your internal owner current. Changes are recorded in review history.</p><form onSubmit={save} aria-busy={busy}><fieldset disabled={busy}><div className="zb-vendor-record-fields">
    <label>Contact person<input required minLength={2} maxLength={120} value={record.contactName} onChange={e => set("contactName", e.target.value)} /></label>
    <label>Designation<input required minLength={2} maxLength={100} value={record.contactRole} onChange={e => set("contactRole", e.target.value)} /></label>
    <label>Business email<input type="email" required maxLength={254} value={record.email} onChange={e => set("email", e.target.value)} /></label>
    <label>Phone<input type="tel" required minLength={7} maxLength={24} value={record.phone} onChange={e => set("phone", e.target.value)} /></label>
    <label>Alternate phone<input type="tel" maxLength={24} value={record.alternatePhone} onChange={e => set("alternatePhone", e.target.value)} /></label>
    <label>Website<input type="url" maxLength={1000} value={record.website} onChange={e => set("website", e.target.value)} /></label>
    <label>Team size / capacity<input type="number" required min={1} max={1000000} value={record.teamSize} onChange={e => set("teamSize", Number(e.target.value))} /></label>
    <label>Internal account owner<input maxLength={120} value={record.accountManager} onChange={e => set("accountManager", e.target.value)} /></label>
  </div><label>Service coverage (comma-separated)<input required maxLength={3600} value={coverage} onChange={e => setCoverage(e.target.value)} /></label><label>Availability / capacity notes<textarea rows={3} maxLength={1500} value={record.capacityNotes} onChange={e => set("capacityNotes", e.target.value)} /></label><label>Internal relationship notes<textarea rows={4} maxLength={4000} value={record.internalNotes} onChange={e => set("internalNotes", e.target.value)} /></label></fieldset>{error && <p className="zb-review-error" role="alert">{error}</p>}<button className="zb-review-button" disabled={busy} type="submit">{busy ? "Saving…" : "Save vendor record"}</button></form></details>;
}

function VendorDetails({ initial, reload }: { initial: VendorDetail; reload: () => void }) {
  const [item, setItem] = useState(initial);
  const [notes, setNotes] = useState(initial.reviewNotes ?? "");
  const [intent, setIntent] = useState<Exclude<VendorStatus, "DRAFT" | "SUBMITTED"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save(status: Exclude<VendorStatus, "DRAFT" | "SUBMITTED">) {
    if (busy) return;
    if (["REJECTED", "SUSPENDED"].includes(status) && notes.trim().length < 10) { setError("Add a reason of at least 10 characters before rejecting or suspending a vendor."); return; }
    setBusy(true); setError(""); setMessage("");
    try { const response = await reviewVendor(item.id, item.revision, status, notes); setItem(response.data.application); setIntent(null); setMessage(status === "APPROVED" ? "Vendor approved. The Vendor Code and record are available in the directory." : "Vendor decision and notes saved."); }
    catch (caught) { setError(errorText(caught)); } finally { setBusy(false); }
  }
  return <>
    <div className="zb-vendor-detail-heading"><div><Badge status={item.status} /><h2>{item.companyName}</h2><p>{vendorOrganizations.find(org => org.value === item.organizationType)?.label ?? item.organizationType} · {item.city}, {item.state}</p>{item.vendorCode && <p className="zb-review-partner-code">{item.vendorCode}</p>}</div><button type="button" className="zb-review-button zb-review-button--secondary" disabled={busy} onClick={reload}><RefreshCw aria-hidden="true" />Reload record</button></div>
    {message && <p role="status" className="zb-vendor-confirmed"><CheckCircle2 aria-hidden="true" />{message}</p>}
    {error && <p className="zb-review-error" role="alert">{error}</p>}
    <div className="zb-review-detail-layout"><div>
      <Block title="Company & registration" icon={Building2}><dl className="zb-review-facts"><div><dt>Established</dt><dd>{item.establishedYear ?? "Not provided"}</dd></div><div><dt>Registration</dt><dd>{item.registrationNumber || "Not provided"}</dd></div><div><dt>GST / tax reference</dt><dd>{item.gstNumber || "Not provided"}</dd></div><div><dt>MSME / Udyam</dt><dd>{item.msmeNumber || "Not provided"}</dd></div><div><dt>Business address</dt><dd>{item.addressLine}, {item.city}, {item.state}, {item.postalCode}, {item.country}</dd></div></dl>{item.website && /^https?:\/\//i.test(item.website) && <a href={item.website} target="_blank" rel="noopener noreferrer">{item.website}</a>}</Block>
      <Block title="Services & capacity" icon={UsersRound}><ul className="zb-review-tags">{item.serviceCategories.map(category => <li key={category}>{vendorCategoryLabel(category)}</li>)}</ul><p>{item.serviceDescription}</p>{item.specializedServices && <p><strong>Specialized services:</strong> {item.specializedServices}</p>}<dl className="zb-review-facts"><div><dt>Relevant experience</dt><dd>{item.yearsExperience} years</dd></div><div><dt>Team / workforce capacity</dt><dd>{item.teamSize.toLocaleString("en-IN")}</dd></div><div><dt>Service coverage</dt><dd>{item.coverage.join(", ")}</dd></div><div><dt>Industries served</dt><dd>{item.industries.join(", ") || "Not provided"}</dd></div></dl>{item.capacityNotes && <p>{item.capacityNotes}</p>}</Block>
      <Block title="Project experience" icon={BadgeCheck}><p>{item.projectExperience}</p>{item.notableClients && <><h3>Clients / reference work</h3><p>{item.notableClients}</p></>}</Block>
      <Block title="Documents for review" icon={FileText}><p className="zb-review-muted">Private attachments. Downloads are recorded in the review history.</p>{item.documents.length ? <ul className="zb-vendor-admin-documents">{item.documents.map(doc => <li key={doc.id}><FileText aria-hidden="true" /><div><strong>{vendorDocumentLabel(doc.kind)}</strong><span>{doc.fileName} · {Math.ceil(doc.size / 1024)} KB</span></div><a href={`/api/backend/admin/vendors/${encodeURIComponent(item.id)}/documents/${encodeURIComponent(doc.id)}`} aria-label={"Download " + vendorDocumentLabel(doc.kind)}><Download aria-hidden="true" />Download</a></li>)}</ul> : <p>No documents attached yet.</p>}</Block>
      {item.vendorCode && <VendorRecordForm key={item.revision} application={item} onSaved={updated => { setItem(updated); setMessage("Vendor contact details and relationship record saved."); }} />}
      <Block title="Review history" icon={ClipboardCheck}>{item.history.length ? <ol className="zb-review-history">{item.history.map(event => <li key={event.id}><strong>{event.metadata?.to ? "Moved to " + vendorStatusLabel(event.metadata.to) : event.action.replaceAll(".", " ").replaceAll("_", " ")}</strong><time dateTime={event.createdAt}>{date(event.createdAt)}</time>{event.metadata?.notes && <p>{event.metadata.notes}</p>}{event.metadata?.fields && <p>Updated: {event.metadata.fields.join(", ")}</p>}{event.metadata?.kind && <p>{vendorDocumentLabel(event.metadata.kind)}</p>}</li>)}</ol> : <p>No review activity yet.</p>}</Block>
    </div><aside className="zb-review-decision">
      <Block title="Authorised contact" icon={Mail}><h3>{item.contactName}</h3><p>{item.contactRole}</p><div className="zb-vendor-contact-links"><a href={"mailto:" + item.email}><Mail aria-hidden="true" />{item.email}</a><a href={"tel:" + item.phone}><Phone aria-hidden="true" />{item.phone}</a>{item.alternatePhone && <a href={"tel:" + item.alternatePhone}>{item.alternatePhone}</a>}</div></Block>
      <Block title="Review & empanelment" icon={ShieldCheck}>
        {item.status === "DRAFT" ? <p>The applicant has not finished submitting. A company profile and final submission are required before review or approval.</p> : <>
          <label>Internal review notes<textarea rows={5} maxLength={4000} value={notes} disabled={busy} onChange={e => setNotes(e.target.value)} placeholder="Capability assessment, documents checked and your decision reason." /></label><p className="zb-review-muted">Record a reason when rejecting or suspending a vendor. Contact the applicant directly about follow-up.</p>
          <div className="zb-vendor-decisions">{decisions[item.status].map(status => <button key={status} type="button" disabled={busy} className={"zb-review-button" + (status === "APPROVED" ? "" : " zb-review-button--secondary")} onClick={() => status === "UNDER_REVIEW" || status === item.status ? void save(status) : setIntent(status)}>{status === "APPROVED" ? <BadgeCheck aria-hidden="true" /> : status === "REJECTED" ? <XCircle aria-hidden="true" /> : status === "SUSPENDED" ? <PauseCircle aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}{status === item.status ? "Save review notes" : status === "APPROVED" ? item.vendorCode ? "Reactivate vendor" : "Approve & empanel" : status === "REJECTED" ? "Reject application" : status === "SUSPENDED" ? "Suspend vendor" : item.status === "REJECTED" ? "Reopen for review" : "Mark under review"}</button>)}</div>
        </>}
        <dl className="zb-vendor-dates"><div><dt>Submitted</dt><dd>{date(item.submittedAt)}</dd></div>{item.approvedAt && <div><dt>First approved</dt><dd>{date(item.approvedAt)}</dd></div>}<div><dt>Consent recorded</dt><dd>{date(item.consentAt)}</dd></div></dl>
      </Block>
      {intent && <section className="zb-review-confirm" aria-labelledby="vendor-confirm-title"><h2 id="vendor-confirm-title">Confirm {vendorStatusLabel(intent).toLowerCase()} decision</h2><p>{item.companyName}</p><p>{intent === "APPROVED" ? "This adds or restores the vendor in the approved network. A Vendor Code is issued on first approval." : "The decision and your reason will be saved in the vendor review history."}</p><button className="zb-review-button" type="button" disabled={busy} onClick={() => void save(intent)}>{busy ? "Saving…" : "Confirm decision"}</button><button className="zb-review-button zb-review-button--secondary" type="button" disabled={busy} onClick={() => setIntent(null)}>Cancel</button></section>}
    </aside></div>
  </>;
}

export function AdminVendors({ id, directory = false }: { id?: string; directory?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState(""); const [draftSearch, setDraftSearch] = useState("");
  const [status, setStatus] = useState(""); const [category, setCategory] = useState(""); const [page, setPage] = useState(1); const [version, setVersion] = useState(0);
  const [data, setData] = useState<VendorList | null>(null); const [item, setItem] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    async function load() {
      setLoading(true); setError(""); setData(null); setItem(null);
      try {
        const current = await getCurrentUser(); if (!active) return;
        if (current.data.user.role !== "ADMIN") { router.replace("/login"); return; }
        if (id) { const response = await getVendor(id, controller.signal); if (active) setItem(response.data); }
        else { const params = new URLSearchParams({ page: String(page), query, view: directory ? "directory" : "applications" }); if (status) params.set("status", status); if (category) params.set("category", category); const response = await listVendors(params, controller.signal); if (active) setData(response.data); }
      } catch (caught) { if (!active) return; if (caught instanceof ApiError && [401,403].includes(caught.status)) router.replace("/login"); else setError(errorText(caught)); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; controller.abort(); };
  }, [id, directory, query, status, category, page, version, router]);
  const statuses = directory ? ["APPROVED", "SUSPENDED"] : ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "DRAFT"];
  const reload = () => setVersion(value => value + 1);
  return <div className="zb-review-page zb-vendor-admin"><nav className="zb-review-nav" aria-label="Vendor administration"><Link href="/admin"><ArrowLeft aria-hidden="true" />Admin dashboard</Link><Link href="/admin/vendors" aria-current={!id && !directory ? "page" : undefined}>Applications</Link><Link href="/admin/vendors/directory" aria-current={directory ? "page" : undefined}>Vendor directory</Link><Link href="/vendor-empanelment">Public vendor form<ArrowRight aria-hidden="true" /></Link></nav>
    <header className="zb-review-hero"><div><span className="zb-eyebrow">Vendor partner network</span><h1>{id ? "Review the company behind the capability." : directory ? "Your empanelled vendor directory." : "Vendor empanelment & onboarding."}</h1><p>{directory ? "Find approved vendors by service area and location. Maintain contacts, capacity and relationship notes." : "Review company capabilities and documents, record your decision and build a qualified vendor network."}</p></div><div className="zb-review-hero-art" aria-hidden="true"><span><Building2 /></span><span><ClipboardCheck /></span><span><Handshake /></span></div></header>
    {loading && <p className="zb-vendor-loading" role="status">Loading vendor records…</p>}{error && <div className="zb-review-error" role="alert"><p>{error}</p><button type="button" className="zb-review-button" onClick={reload}>Try again</button></div>}
    {item && <VendorDetails key={item.id + ":" + version} initial={item} reload={reload} />}
    {data && <>
      <section className="zb-review-stats" aria-label="Vendor network totals">{[
        { label: "Awaiting review", value: (data.counts.SUBMITTED ?? 0) + (data.counts.UNDER_REVIEW ?? 0), icon: Inbox },
        { label: "Approved", value: data.counts.APPROVED ?? 0, icon: BadgeCheck },
        { label: "Suspended", value: data.counts.SUSPENDED ?? 0, icon: PauseCircle },
        { label: "Rejected", value: data.counts.REJECTED ?? 0, icon: XCircle },
      ].map(({ label, value, icon: Icon }) => <article key={label}><Icon aria-hidden="true" /><span>{label}</span><strong>{value}</strong></article>)}</section>
      <form className="zb-review-filters zb-vendor-filters" onSubmit={event => { event.preventDefault(); setPage(1); setQuery(draftSearch.trim()); }}><label>Search company, contact email, city or code<div><Search aria-hidden="true" /><input maxLength={160} value={draftSearch} onChange={e => setDraftSearch(e.target.value)} /></div></label><label>Service area<select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}><option value="">All services</option>{vendorCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}</select></label><label>Status<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">{directory ? "All empanelled vendors" : "All submitted applications"}</option>{statuses.map(value => <option key={value} value={value}>{vendorStatusLabel(value)}</option>)}</select></label><button type="submit" className="zb-review-button">Search</button><button type="button" className="zb-review-button zb-review-button--secondary" onClick={() => { setQuery(""); setDraftSearch(""); setCategory(""); setStatus(""); setPage(1); }}>Reset</button></form>
      <p className="zb-review-results">{data.total} matching {directory ? "vendor records" : "applications"} · Network totals above cover all vendors. {!directory && `${data.counts.DRAFT ?? 0} incomplete drafts can be viewed using the status filter.`}</p>
      {data.items.length ? <div className="zb-review-cards">{data.items.map(vendor => <article key={vendor.id}><div className="zb-review-card-top"><span className="zb-review-avatar"><Building2 aria-hidden="true" /></span><Badge status={vendor.status} /></div><h2><Link href={"/admin/vendors/" + encodeURIComponent(vendor.id)}>{vendor.companyName}</Link></h2>{vendor.vendorCode && <p className="zb-vendor-code">{vendor.vendorCode}</p>}<p><MapPin aria-hidden="true" />{vendor.city}, {vendor.state}</p><ul className="zb-review-tags">{vendor.serviceCategories.map(value => <li key={value}>{vendorCategoryLabel(value)}</li>)}</ul><p>{vendor.yearsExperience} years’ experience · Team of {vendor.teamSize.toLocaleString("en-IN")}</p><p>{vendor.documents.length} document{vendor.documents.length === 1 ? "" : "s"} · {vendor.contactName}</p><small>{date(vendor.submittedAt)}</small><Link className="zb-vendor-open-record" href={"/admin/vendors/" + encodeURIComponent(vendor.id)}>{directory ? "Open vendor record" : "Review application"}<ArrowRight aria-hidden="true" /></Link></article>)}</div> : <section className="zb-vendor-empty"><Inbox aria-hidden="true" /><h2>No matching vendors yet.</h2><p>{directory ? "Approved applications appear here with a Vendor Code." : "Completed vendor applications appear here for review. Try another filter or share the public form."}</p></section>}
      <nav className="zb-vendor-pagination" aria-label="Vendor result pages"><button className="zb-review-button zb-review-button--secondary" type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}><ArrowLeft aria-hidden="true" />Previous</button><span>Page {page} of {data.totalPages}</span><button className="zb-review-button zb-review-button--secondary" type="button" disabled={page >= data.totalPages} onClick={() => setPage(value => value + 1)}>Next<ArrowRight aria-hidden="true" /></button></nav>
    </>}
  </div>;
}
