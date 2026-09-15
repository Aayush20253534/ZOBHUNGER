"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CircleAlert, FileCheck2, Search } from "lucide-react";
import { ApiError } from "@/lib/api";
import { listTechnicalInstitutePortalApplications, type TechnicalApplicationStatus, type TechnicalOpportunityType, type TechnicalPortalApplication } from "@/services/technical-institute-portal.service";

const statuses: TechnicalApplicationStatus[] = ["SUBMITTED", "REVIEWED", "SHORTLISTED", "SELECTED", "JOINED", "REJECTED"];
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

export function TechnicalInstitutePortalApplications() {
  const [items, setItems] = useState<TechnicalPortalApplication[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TechnicalApplicationStatus | "">("");
  const [type, setType] = useState<TechnicalOpportunityType | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setError("");
      listTechnicalInstitutePortalApplications({ page, pageSize: 30, search: search || undefined, status, opportunityType: type })
        .then((response) => { setItems(response.data.items); setTotal(response.data.total); setTotalPages(response.data.totalPages); })
        .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Unable to load applications."));
    }, 160);
    return () => window.clearTimeout(handle);
  }, [search, status, type, page]);

  return <div className="zti-portal-shell"><header className="zti-portal-subhero"><div><Link href="/technical-institute-portal"><ArrowLeft />Portal dashboard</Link><small>Hiring pipeline</small><h1>Student applications</h1><p>Track institute submissions from first review through shortlist, selection and joining.</p></div><Link className="zti-portal-outline-link" href="/technical-institute-portal/opportunities"><BriefcaseBusiness />View opportunities</Link></header>{error && <div className="zti-portal-alert"><CircleAlert />{error}</div>}<section className="zti-portal-opportunity-toolbar"><label><Search /><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Student, employer or opportunity" /></label><select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as TechnicalApplicationStatus | ""); }}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><select value={type} onChange={(event) => { setPage(1); setType(event.target.value as TechnicalOpportunityType | ""); }}><option value="">All types</option><option value="JOB">Jobs</option><option value="INTERNSHIP">Internships</option><option value="APPRENTICESHIP">Apprenticeships</option><option value="TRAINING">Training</option></select><span>{total} records</span></section><section className="zti-portal-card">{items.length ? <div className="zti-portal-application-list">{items.map((application) => <article key={application.id}><span className="zti-portal-avatar">{application.student.fullName.slice(0, 1).toUpperCase()}</span><div className="student"><strong>{application.student.fullName}</strong><p>{application.student.tradeBranch} · {application.student.passingYear} batch</p><small>{application.student.email}</small></div><div className="opportunity"><strong>{application.opportunity.title}</strong><p>{application.opportunity.employerName} · {label(application.opportunity.opportunityType)}</p><small>{application.opportunity.location}</small></div><div className="match"><strong>{application.matchScore}%</strong><small>Match</small></div><span className="zti-portal-status" data-status={application.status}>{label(application.status)}</span><time dateTime={application.updatedAt}>{new Date(application.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</time></article>)}</div> : <div className="zti-portal-empty"><FileCheck2 /><strong>No applications match these filters</strong><p>Submit verified students from the Technical Opportunities page to begin tracking.</p></div>}</section><div className="zti-portal-pagination"><span>Page {page} of {totalPages}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button></div></div></div>;
}
