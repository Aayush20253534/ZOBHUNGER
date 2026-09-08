"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, LoaderCircle, Mail, ShieldCheck, UserRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { requestBusinessRecovery } from "@/services/business.service";
import { useBusiness } from "./BusinessProvider";
import { BusinessHeading } from "./BusinessUI";

export function BusinessAccount() {
  const { user } = useBusiness();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function requestLink() {
    setBusy(true); setError(""); setMessage("");
    try { setMessage((await requestBusinessRecovery(user.email)).message); }
    catch (caught) { setError(caught instanceof ApiError ? caught.message : "We couldn't request your link. Please try again."); }
    finally { setBusy(false); }
  }
  return <>
    <BusinessHeading eyebrow="ACCOUNT & SECURITY" title="Your access, under control." copy="Review your sign-in details and manage your password." />
    <div className="zb-biz-account-grid"><article className="zb-biz-card"><div className="zb-biz-card-heading"><span className="zb-biz-icon"><UserRound aria-hidden="true" /></span><h2>Business account</h2></div><dl className="zb-biz-details"><div><dt>Sign-in email</dt><dd>{user.email}</dd></div><div><dt>Account type</dt><dd>Business</dd></div><div><dt>Account status</dt><dd><span className="zb-biz-pill"><CheckCircle2 aria-hidden="true" />Active</span></dd></div><div><dt>Created</dt><dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(user.createdAt))}</dd></div></dl><p className="zb-biz-field-hint">Only your signed-in business account can update this company profile.</p></article>
      <article className="zb-biz-card"><div className="zb-biz-card-heading"><span className="zb-biz-icon"><KeyRound aria-hidden="true" /></span><h2>Password & recovery</h2></div><p>We&apos;ll send a recovery link to your account email. Choose a new password using the link within 30 minutes.</p><div className="zb-biz-recovery-email"><Mail aria-hidden="true" /><span>{user.email}</span></div><button type="button" className="zb-biz-button" disabled={busy || Boolean(message)} onClick={requestLink}>{busy ? <LoaderCircle className="zb-biz-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}{busy ? "Requesting link…" : message ? "Recovery link requested" : "Email me a password reset link"}</button>{message && <p className="zb-biz-success-inline" role="status">{message}</p>}{error && <p className="zb-biz-error" role="alert">{error}</p>}<p className="zb-biz-security"><ShieldCheck aria-hidden="true" />Changing your password ends existing sessions. Sign in again with your new password.</p></article></div>
  </>;
}
