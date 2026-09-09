"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowUpRight, FilePenLine, Plus, Trash2 } from "lucide-react";
import { deleteDraft, getDraft, listDrafts } from "@/services/phase2.service";
import { useBusiness } from "../BusinessProvider";
import { businessDate, requirementServiceLabel, useBusinessResource } from "../BusinessDashboardUI";
import { BusinessRequirementForm } from "../BusinessRequirementForm";
import { Empty, ErrorState, Heading, Loading, Pages, Refresh } from "./Phase2UI";
import "@/styles/business-dashboard.css";
import "@/styles/business-requirements.css";
export function RequirementDraftEditor({ id }: { id: string }) {
  const { user } = useBusiness(); const [version, setVersion] = useState(0);
  const request = useCallback((signal: AbortSignal) => getDraft(id, signal), [id]);
  const { data, error, loading } = useBusinessResource(`${user.id}:${id}:${version}`, request);
  return <div className="zb-att zb-p2">{loading ? <Loading /> : error ? <ErrorState admin={false} error={error} retry={() => setVersion(v => v + 1)} /> : data?.submittedAt ? <Empty title="This draft has been submitted"><Link href={`/business/requirements/${data.submittedRequirementId}`}>Open the requirement brief</Link></Empty> : data && <BusinessRequirementForm key={`${user.id}:${id}:${data.revision}`} draft={data} />}</div>;
}
export function RequirementDrafts() {
  const { user } = useBusiness(); const [page, setPage] = useState(1); const [version, setVersion] = useState(0); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const request = useCallback((signal: AbortSignal) => listDrafts(page, signal), [page]);
  const { data, error, loading } = useBusinessResource(`${user.id}:${page}:${version}`, request);
  async function remove(id: string, revision: number) {
    if (busy || !window.confirm("Delete this saved draft? Submitted requirements are unaffected.")) return;
    setBusy(true); setMessage(""); try { await deleteDraft(id, revision); setVersion(v => v + 1); setMessage("Draft deleted."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Draft could not be deleted."); } finally { setBusy(false); }
  }
  return <div className="zb-att zb-p2"><Heading eyebrow="SAVED REQUIREMENT DRAFTS" title="Start a brief. Come back ready." action={<><Link className="zb-biz-button" href="/business/requirements/new"><Plus aria-hidden="true" />New requirement</Link><Refresh loading={loading} onClick={() => setVersion(v => v + 1)} /></>}>Your private drafts stay in your account until you submit them to operations.</Heading>{message && <p role="status" className="zb-att-notice">{message}</p>}{loading ? <Loading /> : error ? <ErrorState admin={false} error={error} retry={() => setVersion(v => v + 1)} /> : data && <>{!data.total ? <Empty title="Room for your next requirement">Start a new requirement and choose Save draft at any step.</Empty> : <div className="zb-p2-cards">{data.items.map(draft => <article className="zb-p2-card" key={draft.id}><span className="zb-p2-card-icon"><FilePenLine aria-hidden="true" /></span><p className="zb-biz-eyebrow">DRAFT · NOT SUBMITTED</p><h2>{draft.data.serviceRequired ? requirementServiceLabel(draft.data.serviceRequired) : "Untitled requirement"}</h2><p>{draft.data.companyName || "Company details to add"}</p><dl><div><dt>People</dt><dd>{draft.data.workforceCount || "To decide"}</dd></div><div><dt>Locations</dt><dd>{draft.data.locations.map(row => row.name).filter(Boolean).join(", ") || "To add"}</dd></div></dl><small>Saved {businessDate(draft.updatedAt, true)} IST</small><footer><Link className="zb-biz-text-link" href={`/business/requirements/drafts/${draft.id}`}>Continue draft<ArrowUpRight aria-hidden="true" /></Link><button type="button" className="zb-att-icon-button" disabled={busy} aria-label="Delete draft" onClick={() => void remove(draft.id, draft.revision)}><Trash2 aria-hidden="true" /></button></footer></article>)}</div>}<Pages page={data.page} totalPages={data.totalPages} onChange={setPage} /></>}</div>;
}
