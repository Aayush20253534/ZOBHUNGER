"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  ShieldEllipsis,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { activateAdminInvitation, inspectAdminInvitation, type AdminInvitationInfo } from "@/services/admin-access.service";

function passwordRules(password: string) {
  return [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /[0-9]/.test(password) },
  ];
}

export function AdminAccessActivation() {
  const [token, setToken] = useState("");
  const [invitation, setInvitation] = useState<AdminInvitationInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const rules = useMemo(() => passwordRules(password), [password]);
  const passwordReady = rules.every(rule => rule.valid) && password === confirmPassword;

  useEffect(() => {
    const fragment = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const value = new URLSearchParams(fragment).get("token")?.trim() ?? "";
    if (!value) {
      setChecking(false);
      setError("This activation link is incomplete. Request a fresh administrator invitation from Main Administration.");
      return;
    }
    setToken(value);
    window.history.replaceState(null, "", window.location.pathname);
    void inspectAdminInvitation(value)
      .then(response => setInvitation(response.data))
      .catch(caught => setError(caught instanceof ApiError ? caught.message : "This administrator invitation could not be verified."))
      .finally(() => setChecking(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !passwordReady) return;
    setSubmitting(true);
    setError(null);
    try {
      await activateAdminInvitation(token, password);
      setComplete(true);
      setPassword("");
      setConfirmPassword("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Administrator activation failed. Request a fresh invitation and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="zaa-page">
      <section className="zaa-shell" aria-labelledby="admin-activation-title">
        <aside className="zaa-brand-panel">
          <div className="zaa-wordmark"><strong>ZOB<span>HUNGER</span></strong><small>Secure administration</small></div>
          <div className="zaa-brand-copy"><span><ShieldEllipsis aria-hidden="true" /> Department access</span><h1 id="admin-activation-title">Your workspace starts with secure access.</h1><p>Set your password once, then complete authenticator-based MFA before any private operations data becomes available.</p></div>
          <div className="zaa-security-points"><span><ShieldCheck aria-hidden="true" /><strong>Scoped permissions</strong><small>Only your assigned department workspaces are visible.</small></span><span><LockKeyhole aria-hidden="true" /><strong>MFA enforced</strong><small>Admin APIs remain locked until MFA enrollment is complete.</small></span><span><KeyRound aria-hidden="true" /><strong>One-time invitation</strong><small>The activation token cannot be reused after completion.</small></span></div>
          <footer>Protected ZOBHUNGER operations access</footer>
        </aside>

        <div className="zaa-form-panel">
          {checking ? (
            <div className="zaa-state"><span><LoaderCircle className="zaa-spin" aria-hidden="true" /></span><p className="zaa-eyebrow">Secure invitation</p><h2>Verifying your access link</h2><p>Checking the invitation and department policy.</p></div>
          ) : complete ? (
            <div className="zaa-state is-success"><span><BadgeCheck aria-hidden="true" /></span><p className="zaa-eyebrow">Activation complete</p><h2>Your administrator account is ready.</h2><p>Sign in with your new password. You will be taken through mandatory MFA setup before the department workspace opens.</p><Link href="/login">Continue to secure sign in</Link></div>
          ) : invitation ? (
            <form className="zaa-form" onSubmit={submit}>
              <header><span className="zaa-icon"><ShieldCheck aria-hidden="true" /></span><div><p className="zaa-eyebrow">Administrator activation</p><h2>Create your secure password</h2><p>This invitation is assigned to <strong>{invitation.email}</strong>.</p></div></header>

              <div className="zaa-department"><span>{invitation.departmentLabel}</span><small>Department workspace</small></div>

              <label><span>New password</span><div className="zaa-input"><KeyRound aria-hidden="true" /><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Create a strong password" minLength={8} maxLength={128} required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div></label>
              <label><span>Confirm password</span><div className="zaa-input"><LockKeyhole aria-hidden="true" /><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Repeat your password" minLength={8} maxLength={128} required /></div></label>

              <div className="zaa-rules" aria-label="Password requirements">{rules.map(rule => <span className={rule.valid ? "is-valid" : ""} key={rule.label}><i>{rule.valid && <Check aria-hidden="true" />}</i>{rule.label}</span>)}<span className={confirmPassword && password === confirmPassword ? "is-valid" : ""}><i>{confirmPassword && password === confirmPassword && <Check aria-hidden="true" />}</i>Passwords match</span></div>
              {error && <p className="zaa-error" role="alert">{error}</p>}
              <button className="zaa-submit" type="submit" disabled={submitting || !passwordReady}>{submitting ? <LoaderCircle className="zaa-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}{submitting ? "Activating secure access…" : "Activate administrator account"}</button>
              <p className="zaa-footnote">Invitation expires {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(invitation.expiresAt))}. If it expires, Main Administration can issue a fresh link.</p>
            </form>
          ) : (
            <div className="zaa-state is-error"><span><LockKeyhole aria-hidden="true" /></span><p className="zaa-eyebrow">Invitation unavailable</p><h2>This activation link cannot be used.</h2><p>{error ?? "Request a fresh administrator invitation from Main Administration."}</p><Link href="/login">Return to secure sign in</Link></div>
          )}
        </div>
      </section>
    </main>
  );
}
