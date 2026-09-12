"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, ClipboardCopy, KeyRound, LockKeyhole, QrCode, RefreshCw, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ApiError } from "@/lib/api";
import { beginAdminMfa, changeAdminPassword, confirmAdminMfa, disableAdminMfa, getCurrentUser, requestAdminPasswordReset, rotateAdminMfa } from "@/services/auth.service";

type Setup = { secret: string; otpauthUri: string };
type CopyTarget = "secret" | "uri" | "recovery" | null;

export function AdminSecurity() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<CopyTarget>(null);
  const [managePassword, setManagePassword] = useState("");
  const [manageCode, setManageCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    getCurrentUser().then(result => {
      if (result.data.user.role !== "ADMIN") return router.replace("/login");
      setEmail(result.data.user.email);
      setEnabled(Boolean(result.data.user.adminMfaEnabled));
    }).catch(() => router.replace("/login")).finally(() => setLoading(false));
  }, [router]);

  async function run(task: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await task(); } catch (e) { setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Security update failed."); }
    finally { setBusy(false); }
  }

  async function start() { await run(async () => { const r = await beginAdminMfa(); setSetup(r.data); setCode(""); }); }
  async function confirm() { await run(async () => { const r = await confirmAdminMfa(code.trim()); setEnabled(true); setRecoveryCodes(r.data.recoveryCodes); setSetup(null); setCode(""); setMessage("Multi-factor authentication is now enabled."); }); }
  async function disable() { await run(async () => { await disableAdminMfa(managePassword, manageCode); setEnabled(false); setManagePassword(""); setManageCode(""); setMessage("MFA has been turned off. Password sign-in remains available."); }); }
  async function rotate() { await run(async () => { const r = await rotateAdminMfa(managePassword, manageCode); setEnabled(false); setSetup({ secret: r.data.secret, otpauthUri: r.data.otpauthUri }); setManagePassword(""); setManageCode(""); setCode(""); setMessage("New authenticator setup created. Scan it and verify the new code below."); }); }
  async function changePassword(event: FormEvent) { event.preventDefault(); await run(async () => { if (newPassword !== confirmPassword) throw new Error("The new passwords do not match."); await changeAdminPassword(currentPassword, newPassword); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setMessage("Administrator password updated. Other sessions were invalidated."); }); }
  async function sendReset() { await run(async () => { const r = await requestAdminPasswordReset(email); setMessage(r.message); }); }
  async function copy(value: string, target: Exclude<CopyTarget, null>) { try { await navigator.clipboard.writeText(value); setCopied(target); window.setTimeout(() => setCopied(v => v === target ? null : v), 1600); } catch { setError("Copy was blocked by the browser."); } }

  if (loading) return <section className="zb-admin-security-card zb-admin-security-loading"><ShieldCheck /><span>Checking administrator security…</span></section>;

  return <div className="zb-admin-security-page">
    <section className="zb-admin-security-card">
      <header className="zb-admin-security-heading">
        <span className="zb-admin-security-icon"><ShieldCheck /></span>
        <div><p className="zb-eyebrow">Administrator security</p><h1>Account protection</h1><p>MFA is optional. If you enable it, sign-in will require your password plus an authenticator or recovery code.</p></div>
        <span className={`zb-admin-security-status${enabled ? " is-enabled" : ""}`}>{enabled ? <CheckCircle2 /> : <ShieldOff />}<span>{enabled ? "MFA enabled" : "Password only"}</span></span>
      </header>
      {error && <p className="zb-login-error zb-admin-security-error" role="alert">{error}</p>}
      {message && <p className="zb-admin-security-message" role="status">{message}</p>}

      {!enabled && !setup && <div className="zb-admin-security-start"><div className="zb-admin-security-start-copy"><span><Smartphone /></span><div><strong>Add an authenticator</strong><p>Optional extra protection using Google Authenticator, Microsoft Authenticator, Authy, 1Password or another TOTP app.</p></div></div><button type="button" disabled={busy} onClick={() => void start()}>Set up MFA <ArrowRight /></button></div>}

      {enabled && !recoveryCodes.length && <div className="zb-admin-security-manage-grid">
        <section className="zb-admin-security-manage-card"><div><RefreshCw /><span><strong>Change MFA device</strong><small>Verify your current password and current authenticator code, then connect the replacement device.</small></span></div><label>Current password<input type="password" autoComplete="current-password" value={managePassword} onChange={e => setManagePassword(e.target.value)} /></label><label>Current authenticator code<input inputMode="numeric" value={manageCode} onChange={e => setManageCode(e.target.value.replace(/\D/g, "").slice(0,6))} placeholder="000000" /></label><button type="button" disabled={busy || !managePassword || manageCode.length !== 6} onClick={() => void rotate()}>Change device</button></section>
        <section className="zb-admin-security-manage-card is-danger"><div><ShieldOff /><span><strong>Turn off MFA</strong><small>Your administrator account will continue to work with password-only sign-in.</small></span></div><p>Use the same verification fields above to confirm this change.</p><button type="button" disabled={busy || !managePassword || manageCode.length !== 6} onClick={() => void disable()}>Turn off MFA</button></section>
      </div>}

      {setup && <div className="zb-admin-mfa-setup"><div className="zb-admin-mfa-grid"><section className="zb-admin-mfa-panel"><div className="zb-admin-mfa-panel-head"><div><p className="zb-eyebrow">Connect device</p><h2>Scan the QR code</h2></div><QrCode /></div><div className="zb-admin-qr-wrap"><div className="zb-admin-qr-code"><QRCodeSVG value={setup.otpauthUri} size={174} level="M" bgColor="#fff" fgColor="#18171a" marginSize={2} /></div><div className="zb-admin-qr-copy"><strong>Authenticator setup</strong><p>Scan the code, or use the setup key manually.</p><div className="zb-admin-secret"><code>{setup.secret}</code><button type="button" onClick={() => void copy(setup.secret, "secret")}>{copied === "secret" ? <Check /> : <ClipboardCopy />}{copied === "secret" ? "Copied" : "Copy key"}</button></div></div></div></section><section className="zb-admin-mfa-panel zb-admin-mfa-verify"><div><p className="zb-eyebrow">Verify device</p><h2>Enter the new code</h2><p>This activates MFA only after the code succeeds.</p></div><label htmlFor="admin-mfa-code">Authenticator code</label><input id="admin-mfa-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" /><button type="button" className="zb-admin-mfa-primary" disabled={busy || code.length !== 6} onClick={() => void confirm()}>Verify and enable MFA <ArrowRight /></button></section></div></div>}

      {recoveryCodes.length > 0 && <div className="zb-admin-recovery"><div className="zb-admin-recovery-head"><span><CheckCircle2 /></span><div><p className="zb-eyebrow">MFA enabled</p><h2>Save your recovery codes</h2><p>Each code works once if the authenticator is unavailable.</p></div></div><div className="zb-admin-recovery-grid">{recoveryCodes.map((v,i) => <div key={v}><span>{String(i+1).padStart(2,"0")}</span><code>{v}</code></div>)}</div><div className="zb-admin-recovery-actions"><button type="button" onClick={() => void copy(recoveryCodes.join("\n"), "recovery")}><ClipboardCopy />Copy all codes</button><Link href="/admin">Continue to dashboard <ArrowRight /></Link></div></div>}
    </section>

    <section className="zb-admin-security-passwords">
      <form className="zb-admin-security-password-card" onSubmit={changePassword}><div className="zb-admin-security-password-head"><span><LockKeyhole /></span><div><p className="zb-eyebrow">Password</p><h2>Change administrator password</h2><p>Use this when you know your current password.</p></div></div><label>Current password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label><label>New password<input type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label><label>Confirm new password<input type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label><button type="submit" disabled={busy}>Update password</button></form>
      <section className="zb-admin-security-password-card"><div className="zb-admin-security-password-head"><span><KeyRound /></span><div><p className="zb-eyebrow">Recovery</p><h2>Reset by email</h2><p>Send a one-time reset link to <strong>{email}</strong>.</p></div></div><button type="button" disabled={busy} onClick={() => void sendReset()}>Send password reset email</button><Link href="/forgot-password">Open recovery page <ArrowRight /></Link></section>
    </section>
  </div>;
}
