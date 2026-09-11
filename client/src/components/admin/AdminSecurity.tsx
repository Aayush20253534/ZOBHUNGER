"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCopy,
  KeyRound,
  QrCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ApiError } from "@/lib/api";
import { beginAdminMfa, confirmAdminMfa, getCurrentUser } from "@/services/auth.service";

interface Setup {
  secret: string;
  otpauthUri: string;
}

type CopyTarget = "secret" | "uri" | "recovery" | null;
type SetupView = "qr" | "key";

export function AdminSecurity() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [setupView, setSetupView] = useState<SetupView>("qr");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<CopyTarget>(null);

  useEffect(() => {
    getCurrentUser()
      .then((result) => {
        if (result.data.user.role !== "ADMIN") router.replace("/login");
        else setEnabled(Boolean(result.data.user.adminMfaEnabled));
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function start() {
    setBusy(true);
    setError(null);
    setCopied(null);
    try {
      const result = await beginAdminMfa();
      setSetup(result.data);
      setSetupView("qr");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "MFA setup could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!setup || !code.trim()) return;
    setBusy(true);
    setError(null);
    setCopied(null);
    try {
      const result = await confirmAdminMfa(code.trim());
      setEnabled(true);
      setRecoveryCodes(result.data.recoveryCodes);
      setSetup(null);
      setCode("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "The authenticator code could not be verified.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string, target: Exclude<CopyTarget, null>) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      window.setTimeout(() => {
        setCopied((current) => (current === target ? null : current));
      }, 1800);
    } catch {
      setError("Copy was blocked by the browser. Select the value manually.");
    }
  }

  if (loading) {
    return (
      <section className="zb-admin-security-card zb-admin-security-loading" aria-live="polite">
        <ShieldCheck aria-hidden="true" />
        <span>Checking administrator security…</span>
      </section>
    );
  }

  return (
    <section className="zb-admin-security-card">
      <header className="zb-admin-security-heading">
        <span className="zb-admin-security-icon"><ShieldCheck aria-hidden="true" /></span>
        <div>
          <p className="zb-eyebrow">Administrator security</p>
          <h1>Multi-factor authentication</h1>
          <p>Protect administrator access with a time-based authenticator code.</p>
        </div>
        <span className={`zb-admin-security-status${enabled ? " is-enabled" : ""}`}>
          {enabled ? <CheckCircle2 aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          <span className="zb-admin-security-status-label">{enabled ? "Protected" : "Setup required"}</span>
        </span>
      </header>

      {error && <p className="zb-login-error zb-admin-security-error" role="alert">{error}</p>}

      {enabled && !recoveryCodes.length && (
        <div className="zb-admin-security-state zb-admin-security-state--success">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>MFA is enabled</strong>
            <p>Your administrator account is protected by an authenticator second factor.</p>
          </div>
          <Link href="/admin">Admin dashboard <ArrowRight aria-hidden="true" /></Link>
        </div>
      )}

      {!enabled && !setup && (
        <div className="zb-admin-security-start">
          <div className="zb-admin-security-start-copy">
            <span><Smartphone aria-hidden="true" /></span>
            <div>
              <strong>Connect an authenticator app</strong>
              <p>Use Google Authenticator, Microsoft Authenticator, Authy, 1Password or another TOTP-compatible app.</p>
            </div>
          </div>
          <button type="button" disabled={busy} onClick={() => void start()}>
            {busy ? "Preparing secure setup…" : "Set up authenticator"}
            {!busy && <ArrowRight aria-hidden="true" />}
          </button>
        </div>
      )}

      {setup && (
        <div className="zb-admin-mfa-setup">
          <div className="zb-admin-mfa-steps" aria-label="MFA setup progress">
            <span className="is-active"><b>1</b> Connect app</span>
            <i aria-hidden="true" />
            <span><b>2</b> Verify code</span>
            <i aria-hidden="true" />
            <span><b>3</b> Save recovery codes</span>
          </div>

          <div className="zb-admin-mfa-grid">
            <section className="zb-admin-mfa-panel" aria-labelledby="mfa-connect-title">
              <div className="zb-admin-mfa-panel-head">
                <div>
                  <p className="zb-eyebrow">Step 1</p>
                  <h2 id="mfa-connect-title">Connect your authenticator</h2>
                </div>
                <div className="zb-admin-mfa-tabs" role="tablist" aria-label="Authenticator setup method">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={setupView === "qr"}
                    className={setupView === "qr" ? "is-active" : ""}
                    onClick={() => setSetupView("qr")}
                  >
                    <QrCode aria-hidden="true" /> Scan QR
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={setupView === "key"}
                    className={setupView === "key" ? "is-active" : ""}
                    onClick={() => setSetupView("key")}
                  >
                    <KeyRound aria-hidden="true" /> Setup key
                  </button>
                </div>
              </div>

              {setupView === "qr" ? (
                <div className="zb-admin-qr-wrap" role="tabpanel">
                  <div className="zb-admin-qr-code" aria-label="Authenticator setup QR code">
                    <QRCodeSVG
                      value={setup.otpauthUri}
                      size={174}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#18171a"
                      marginSize={2}
                    />
                  </div>
                  <div className="zb-admin-qr-copy">
                    <strong>Scan with your authenticator app</strong>
                    <p>The QR is generated locally from your setup URI. Your secret is not sent to an external QR service.</p>
                  </div>
                </div>
              ) : (
                <div className="zb-admin-key-wrap" role="tabpanel">
                  <p>Choose <strong>Enter setup key</strong> in your authenticator app and paste this value.</p>
                  <div className="zb-admin-secret">
                    <code>{setup.secret}</code>
                    <button
                      type="button"
                      className={copied === "secret" ? "is-copied" : ""}
                      onClick={() => void copy(setup.secret, "secret")}
                      aria-label="Copy authenticator setup key"
                    >
                      {copied === "secret" ? <Check aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
                      <span>{copied === "secret" ? "Code copied" : "Copy code"}</span>
                    </button>
                  </div>
                </div>
              )}

              <details className="zb-admin-uri-details">
                <summary>Advanced: setup URI</summary>
                <div className="zb-admin-secret">
                  <code>{setup.otpauthUri}</code>
                  <button
                    type="button"
                    className={copied === "uri" ? "is-copied" : ""}
                    onClick={() => void copy(setup.otpauthUri, "uri")}
                    aria-label="Copy authenticator setup URI"
                  >
                    {copied === "uri" ? <Check aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
                    <span>{copied === "uri" ? "URI copied" : "Copy URI"}</span>
                  </button>
                </div>
              </details>
            </section>

            <section className="zb-admin-mfa-panel zb-admin-mfa-verify" aria-labelledby="mfa-verify-title">
              <div>
                <p className="zb-eyebrow">Step 2</p>
                <h2 id="mfa-verify-title">Verify the connection</h2>
                <p>Enter the current 6-digit code shown in your authenticator app.</p>
              </div>
              <label htmlFor="admin-mfa-code">Authenticator code</label>
              <input
                id="admin-mfa-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                minLength={6}
                maxLength={6}
                placeholder="000000"
                aria-describedby="admin-mfa-code-help"
              />
              <small id="admin-mfa-code-help">Codes refresh approximately every 30 seconds.</small>
              <button
                type="button"
                className="zb-admin-mfa-primary"
                disabled={busy || !/^\d{6}$/.test(code)}
                onClick={() => void confirm()}
              >
                {busy ? "Verifying…" : "Verify and enable MFA"}
                {!busy && <ArrowRight aria-hidden="true" />}
              </button>
            </section>
          </div>
        </div>
      )}

      {recoveryCodes.length > 0 && (
        <div className="zb-admin-recovery">
          <div className="zb-admin-recovery-head">
            <span><CheckCircle2 aria-hidden="true" /></span>
            <div>
              <p className="zb-eyebrow">MFA enabled</p>
              <h2>Save your recovery codes</h2>
              <p>Each code works once if your authenticator is unavailable. They cannot be shown again after you leave this screen.</p>
            </div>
          </div>

          <div className="zb-admin-recovery-grid" aria-label="One-time recovery codes">
            {recoveryCodes.map((value, index) => (
              <div key={value}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <code>{value}</code>
              </div>
            ))}
          </div>

          <div className="zb-admin-recovery-actions">
            <button
              type="button"
              className={`zb-admin-recovery-copy${copied === "recovery" ? " is-copied" : ""}`}
              onClick={() => void copy(recoveryCodes.join("\n"), "recovery")}
            >
              {copied === "recovery" ? <Check aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
              {copied === "recovery" ? "Codes copied" : "Copy all codes"}
            </button>
            <Link href="/admin">
              I saved them · Continue to dashboard
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      <span className="zb-admin-copy-announcer" role="status" aria-live="polite">
        {copied === "secret" ? "Authenticator setup code copied." : copied === "uri" ? "Authenticator setup URI copied." : copied === "recovery" ? "Recovery codes copied." : ""}
      </span>
    </section>
  );
}
