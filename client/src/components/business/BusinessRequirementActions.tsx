"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleAlert, LoaderCircle, Pencil, RefreshCw, X } from "lucide-react";
import { ApiError } from "@/lib/api";
import { withdrawBusinessRequirement } from "@/services/business.service";
import type { BusinessRequirementData } from "@/types/business-dashboard.types";

export function BusinessRequirementActions({ item, onChanged }: { item: BusinessRequirementData["requirement"]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  const conflict = error instanceof ApiError && ["REQUIREMENT_CHANGED", "REQUIREMENT_CLOSED"].includes(error.code ?? "");
  async function withdraw(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    if (reason.trim().length < 5) { setError(new Error("Add a short reason with at least 5 characters.")); requestAnimationFrame(() => feedback.current?.focus()); return; }
    pending.current = true; setBusy(true); setError(null);
    try { await withdrawBusinessRequirement(item.id, item.revision, reason.trim()); setOpen(false); onChanged(); }
    catch (error) { setError(error instanceof Error ? error : new Error("We couldn’t withdraw this request. Please try again.")); requestAnimationFrame(() => feedback.current?.focus()); }
    finally { pending.current = false; setBusy(false); }
  }
  if (item.status === "CLOSED") return <p className="zb-req-closed-note">This requirement is closed. Its brief and history remain available.</p>;
  return <div className="zb-req-detail-actions"><Link href={`/business/requirements/${item.id}/edit`} className="zb-biz-button"><Pencil aria-hidden="true" />Edit brief</Link><button ref={trigger} className="zb-biz-button zb-biz-button--secondary" onClick={() => { setError(null); setOpen(true); }}><X aria-hidden="true" />Withdraw requirement</button>
    <dialog ref={dialog} className="zb-req-withdraw-dialog" aria-labelledby="withdraw-title" aria-describedby="withdraw-description" onCancel={event => { if (busy) event.preventDefault(); else setOpen(false); }} onClose={() => { setOpen(false); trigger.current?.focus(); }}>
      <form onSubmit={withdraw} noValidate aria-busy={busy}><div className="zb-req-dialog-heading"><span className="zb-biz-icon"><CircleAlert aria-hidden="true" /></span><button type="button" disabled={busy} aria-label="Close withdrawal dialog" onClick={() => setOpen(false)}><X aria-hidden="true" /></button></div><h2 id="withdraw-title">Withdraw this requirement?</h2><p id="withdraw-description">This closes the request and removes it from your open totals. Its brief and history stay available for reference.</p><label htmlFor="withdraw-reason">Reason for withdrawal</label><textarea id="withdraw-reason" value={reason} onChange={event => setReason(event.target.value)} rows={4} maxLength={600} required minLength={5} disabled={busy} placeholder="For example, the project has been postponed." aria-describedby={error ? "withdraw-error" : undefined} aria-invalid={Boolean(error)} />
        {error && <p id="withdraw-error" className="zb-req-field-error" role="alert" ref={feedback} tabIndex={-1}>{error.message}</p>}
        {conflict ? <button type="button" className="zb-biz-button" onClick={() => { setOpen(false); onChanged(); }}><RefreshCw aria-hidden="true" />Open the latest brief</button> : <div className="zb-req-form-actions"><button type="button" className="zb-biz-button zb-biz-button--secondary" disabled={busy} onClick={() => setOpen(false)}>Keep requirement</button><button type="submit" className="zb-biz-button" disabled={busy}>{busy ? <LoaderCircle aria-hidden="true" className="zb-biz-spin" /> : <X aria-hidden="true" />}{busy ? "Withdrawing…" : "Confirm withdrawal"}</button></div>}
      </form>
    </dialog>
  </div>;
}
