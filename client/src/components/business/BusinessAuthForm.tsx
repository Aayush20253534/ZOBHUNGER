"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import { businessDestination, businessLogin, changeBusinessPassword, requestBusinessRecovery, resetBusinessPassword } from "@/services/business.service";
import { getCurrentUser } from "@/services/auth.service";

export type BusinessAccessMode = "login" | "forgot" | "reset" | "change";
const content = {
  login: { label: "APPROVED PARTNER ACCESS", title: "Let's get to work.", copy: "Use the Partner ID issued after your application was approved.", action: "Sign in to workspace" },
  forgot: { label: "ACCOUNT RECOVERY", title: "A fresh start, securely.", copy: "Enter your approved account email. We'll send a link to choose a new password.", action: "Send recovery link" },
  reset: { label: "CHOOSE A PASSWORD", title: "Back in your hands.", copy: "Create a new password. You'll sign in again after saving it.", action: "Save new password" },
  change: { label: "FIRST LOGIN · PASSWORD SETUP", title: "Make this account yours.", copy: "Replace the temporary password from your approval message before opening your workspace.", action: "Set password & open workspace" },
};
function subscribeHash(callback: () => void) { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); }
function readToken() { return new URLSearchParams(window.location.hash.slice(1)).get("token") ?? ""; }

export function BusinessAuthForm({ mode }: { mode: BusinessAccessMode }) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeHash, readToken, () => "");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(mode !== "change");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const copy = content[mode];
  const newPassword = mode === "change" || mode === "reset";
  const validToken = /^[a-f0-9]{64}$/.test(token);

  useEffect(() => {
    if (mode !== "change") return;
    let active = true;
    getCurrentUser().then(response => {
      if (!active) return;
      if (response.data.user.role !== "BUSINESS") router.replace("/business/login");
      else if (!response.data.user.mustChangePassword) router.replace("/business");
      else setReady(true);
    }).catch(() => { if (active) router.replace("/business/login"); });
    return () => { active = false; };
  }, [mode, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (newPassword && password !== confirmation) { setError("The passwords don't match. Please check them."); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        const result = await businessLogin(identifier.trim(), password);
        setPassword("");
        router.replace(result.data.user.mustChangePassword ? "/business/change-password" : businessDestination(new URLSearchParams(window.location.search).get("next")));
        router.refresh();
      } else if (mode === "change") {
        await changeBusinessPassword(currentPassword, password);
        setCurrentPassword(""); setPassword(""); setConfirmation("");
        router.replace("/business"); router.refresh();
      } else if (mode === "forgot") {
        const result = await requestBusinessRecovery(identifier.trim());
        setSuccess(result.message);
      } else {
        const result = await resetBusinessPassword(token, password);
        setPassword(""); setConfirmation(""); setSuccess(result.message);
        window.history.replaceState(null, "", window.location.pathname);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "We couldn't connect. Check your connection and try again.");
    } finally { setBusy(false); }
  }

  return <>
    <span className="zb-biz-icon zb-biz-icon--large"><KeyRound aria-hidden="true" /></span>
    <p className="zb-biz-eyebrow">{copy.label}</p><h1>{copy.title}</h1><p className="zb-biz-muted">{copy.copy}</p>
    {!ready ? <p role="status"><LoaderCircle className="zb-biz-spin" aria-hidden="true" /> Checking your approved account…</p>
      : success ? <div className="zb-biz-success" role="status"><CheckCircle2 aria-hidden="true" /><h2>{mode === "forgot" ? "Check your email" : "Password updated"}</h2><p>{success}</p><Link href="/business/login" className="zb-biz-button">Return to sign in<ArrowRight aria-hidden="true" /></Link></div>
      : mode === "reset" && !validToken ? <div className="zb-biz-notice"><p>Open the recovery link from your email to choose a new password. If it has expired, request a fresh link.</p><Link href="/business/forgot-password" className="zb-biz-button">Request a recovery link</Link></div>
      : <form className="zb-biz-form" onSubmit={submit} aria-busy={busy}>
        {(mode === "login" || mode === "forgot") && <label className="zb-biz-field"><span>{mode === "login" ? "Partner ID or approved email" : "Business email"}</span><input type={mode === "login" ? "text" : "email"} name="identifier" autoComplete={mode === "login" ? "username" : "email"} autoCapitalize="none" spellCheck={false} required maxLength={254} value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder={mode === "login" ? "Your ZB-Partner ID" : "you@company.com"} /></label>}
        {mode === "change" && <label className="zb-biz-field"><span>Temporary password</span><input type={visible ? "text" : "password"} autoComplete="current-password" name="currentPassword" required maxLength={128} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>}
        {mode !== "forgot" && <>
          <label className="zb-biz-field"><span>{newPassword ? "New password" : "Password"}</span><span className="zb-biz-password"><input type={visible ? "text" : "password"} name="password" autoComplete={newPassword ? "new-password" : "current-password"} required minLength={newPassword ? 8 : 1} maxLength={128} pattern={newPassword ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,128}" : undefined} title={newPassword ? "Use at least 8 characters, including uppercase, lowercase and a number." : undefined} aria-describedby={newPassword ? "password-guidance" : undefined} value={password} onChange={e => setPassword(e.target.value)} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></span></label>
          {newPassword && <><p id="password-guidance" className="zb-biz-field-hint">8–128 characters, with uppercase, lowercase and a number. Choose a password you have not used for this account.</p><label className="zb-biz-field"><span>Confirm new password</span><input type={visible ? "text" : "password"} autoComplete="new-password" name="confirmation" required maxLength={128} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label></>}
        </>}
        {mode === "login" && <Link className="zb-biz-text-link" href="/business/forgot-password">Forgot your password?</Link>}
        {error && <p className="zb-biz-error" role="alert">{error}</p>}
        <button type="submit" className="zb-biz-button" disabled={busy}>{busy ? <LoaderCircle className="zb-biz-spin" aria-hidden="true" /> : mode === "forgot" ? <Mail aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}{busy ? "Please wait…" : copy.action}</button>
      </form>}
    <p className="zb-biz-auth-switch">{mode === "login" ? <>Need business access? <Link href="/become-a-partner#partner-application">Apply to become a partner</Link></> : <Link href="/business/login">Back to business sign in</Link>}</p>
    <p className="zb-biz-security"><ShieldCheck aria-hidden="true" />Accounts are issued after company approval.</p>
    {mode === "login" && <Link className="zb-biz-other-account" href="/login">Worker, admin or institution account? Use portal access</Link>}
  </>;
}
