"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import { businessDestination, businessLogin, registerBusiness, requestBusinessRecovery, resetBusinessPassword } from "@/services/business.service";

export type BusinessAccessMode = "login" | "register" | "forgot" | "reset";
const content = {
  login: { label: "WELCOME BACK", title: "Let's get to work.", copy: "Sign in to your company workspace.", action: "Sign in to workspace" },
  register: { label: "BUSINESS ACCESS", title: "Make room for what's next.", copy: "Create your account, then tell us about your company.", action: "Create business account" },
  forgot: { label: "ACCOUNT RECOVERY", title: "A fresh start, securely.", copy: "Enter your business account email. We'll send a link to choose a new password.", action: "Send recovery link" },
  reset: { label: "CHOOSE A PASSWORD", title: "Back in your hands.", copy: "Create a new password. You'll sign in again after saving it.", action: "Save new password" },
};
function subscribeHash(callback: () => void) { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); }
function readToken() { return new URLSearchParams(window.location.hash.slice(1)).get("token") ?? ""; }

export function BusinessAuthForm({ mode }: { mode: BusinessAccessMode }) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeHash, readToken, () => "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const copy = content[mode];
  const newPassword = mode === "register" || mode === "reset";
  const validToken = /^[a-f0-9]{64}$/.test(token);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (newPassword && password !== confirmation) { setError("The passwords don't match. Please check them."); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        await businessLogin(email.trim(), password);
        router.replace(businessDestination(new URLSearchParams(window.location.search).get("next")));
        router.refresh();
      } else if (mode === "register") {
        await registerBusiness(email.trim(), password);
        router.replace("/business/onboarding");
        router.refresh();
      } else if (mode === "forgot") {
        const result = await requestBusinessRecovery(email.trim());
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
    {success ? <div className="zb-biz-success" role="status"><CheckCircle2 aria-hidden="true" /><h2>{mode === "forgot" ? "Check your email" : "Password updated"}</h2><p>{success}</p><Link href="/business/login" className="zb-biz-button">Return to sign in<ArrowRight aria-hidden="true" /></Link></div>
      : mode === "reset" && !validToken ? <div className="zb-biz-notice"><p>Open the recovery link from your email to choose a new password. If it has expired, request a fresh link.</p><Link href="/business/forgot-password" className="zb-biz-button">Request a recovery link</Link></div>
      : <form className="zb-biz-form" onSubmit={submit} aria-busy={busy}>
        {mode !== "reset" && <label className="zb-biz-field"><span>Business email</span><input type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></label>}
        {mode !== "forgot" && <>
          <label className="zb-biz-field"><span>{newPassword ? "Create password" : "Password"}</span><span className="zb-biz-password"><input type={visible ? "text" : "password"} name="password" autoComplete={newPassword ? "new-password" : "current-password"} required minLength={newPassword ? 8 : 1} maxLength={128} pattern={newPassword ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,128}" : undefined} title={newPassword ? "Use at least 8 characters, including uppercase, lowercase and a number." : undefined} aria-describedby={newPassword ? "password-guidance" : undefined} value={password} onChange={e => setPassword(e.target.value)} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></span></label>
          {newPassword && <><p id="password-guidance" className="zb-biz-field-hint">8–128 characters, with uppercase, lowercase and a number.</p><label className="zb-biz-field"><span>Confirm password</span><input type={visible ? "text" : "password"} autoComplete="new-password" name="confirmation" required maxLength={128} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label></>}
        </>}
        {mode === "login" && <Link className="zb-biz-text-link" href="/business/forgot-password">Forgot your password?</Link>}
        {error && <p className="zb-biz-error" role="alert">{error}</p>}
        <button type="submit" className="zb-biz-button" disabled={busy}>{busy ? <LoaderCircle className="zb-biz-spin" aria-hidden="true" /> : mode === "forgot" ? <Mail aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}{busy ? "Please wait…" : copy.action}</button>
      </form>}
    <p className="zb-biz-auth-switch">{mode === "login" ? <>New to ZOBHUNGER? <Link href="/business/register">Create a business account</Link></> : mode === "register" ? <>Already registered? <Link href="/business/login">Sign in</Link></> : <Link href="/business/login">Back to business sign in</Link>}</p>
    <p className="zb-biz-security"><ShieldCheck aria-hidden="true" />Access is limited to your business account.</p>
    {mode === "login" && <Link className="zb-biz-other-account" href="/login">Worker, admin or institution account? Use portal access</Link>}
  </>;
}
