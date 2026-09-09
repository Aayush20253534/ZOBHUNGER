"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardCopy, KeyRound, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import { beginAdminMfa, confirmAdminMfa, getCurrentUser } from "@/services/auth.service";

interface Setup { secret: string; otpauthUri: string }

export function AdminSecurity() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentUser().then(result => {
      if (result.data.user.role !== "ADMIN") router.replace("/login");
      else setEnabled(Boolean(result.data.user.adminMfaEnabled));
    }).catch(() => router.replace("/login")).finally(() => setLoading(false));
  }, [router]);

  async function start() {
    setBusy(true); setError(null);
    try { const result = await beginAdminMfa(); setSetup(result.data); }
    catch (e) { setError(e instanceof ApiError ? e.message : "MFA setup could not be created."); }
    finally { setBusy(false); }
  }

  async function confirm() {
    if (!setup || !code.trim()) return;
    setBusy(true); setError(null);
    try {
      const result = await confirmAdminMfa(code.trim());
      setEnabled(true); setRecoveryCodes(result.data.recoveryCodes); setSetup(null); setCode("");
    } catch (e) { setError(e instanceof ApiError ? e.message : "The authenticator code could not be verified."); }
    finally { setBusy(false); }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); } catch { setError("Copy was blocked by the browser. Select the value manually."); }
  }

  if (loading) return <section className="zb-admin-security-card"><p>Checking administrator security…</p></section>;

  return <section className="zb-admin-security-card">
    <div className="zb-admin-security-heading"><span><ShieldCheck /></span><div><p className="zb-eyebrow">Administrator account security</p><h1>Multi-factor authentication</h1><p>Admin access requires a time-based authenticator code in addition to your password.</p></div></div>

    {error && <p className="zb-login-error" role="alert">{error}</p>}

    {enabled && !recoveryCodes.length && <div className="zb-admin-security-state"><CheckCircle2 /><div><strong>MFA is enabled</strong><p>Your admin APIs are protected by a second factor. Keep your recovery codes somewhere private.</p><Link href="/admin">Continue to admin dashboard</Link></div></div>}

    {!enabled && !setup && <div className="zb-admin-security-state"><KeyRound /><div><strong>Set up an authenticator before continuing</strong><p>Use any standards-compatible TOTP authenticator. The setup secret is shown only during enrollment.</p><button type="button" disabled={busy} onClick={() => void start()}>{busy ? "Preparing…" : "Create MFA setup"}</button></div></div>}

    {setup && <div className="zb-admin-mfa-setup">
      <div><p className="zb-eyebrow">Step 1</p><h2>Add ZOBHUNGER to your authenticator</h2><p>Enter this secret manually, or paste the setup URI into an authenticator that supports it.</p></div>
      <div className="zb-admin-secret"><code>{setup.secret}</code><button type="button" onClick={() => void copy(setup.secret)} aria-label="Copy authenticator secret"><ClipboardCopy /></button></div>
      <details><summary>Show setup URI</summary><div className="zb-admin-secret"><code>{setup.otpauthUri}</code><button type="button" onClick={() => void copy(setup.otpauthUri)} aria-label="Copy setup URI"><ClipboardCopy /></button></div></details>
      <label><span>Step 2 · Enter the current 6-digit code</span><input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} placeholder="123456" /></label>
      <button type="button" disabled={busy || !/^\d{6}$/.test(code)} onClick={() => void confirm()}>{busy ? "Verifying…" : "Verify and enable MFA"}</button>
    </div>}

    {recoveryCodes.length > 0 && <div className="zb-admin-recovery"><div><p className="zb-eyebrow">One-time recovery codes</p><h2>Save these now</h2><p>Each code works once if your authenticator is unavailable. They are not retrievable after you leave this page.</p></div><div className="zb-admin-recovery-grid">{recoveryCodes.map(value => <code key={value}>{value}</code>)}</div><button type="button" onClick={() => void copy(recoveryCodes.join("\n"))}><ClipboardCopy />Copy all codes</button><Link href="/admin">I saved them · Continue to dashboard</Link></div>}
  </section>;
}
