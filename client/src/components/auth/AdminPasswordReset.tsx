"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import { resetAdminPassword } from "@/services/auth.service";

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="zb-recovery-field">
      <span>{label}</span>
      <span className="zb-recovery-input-wrap">
        <KeyRound aria-hidden="true" />
        <input
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={8}
          maxLength={128}
          required
        />
        <button
          type="button"
          className="zb-recovery-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

export function AdminPasswordReset() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [readingLink, setReadingLink] = useState(true);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fragment = useRef<string | null>(null);

  useEffect(() => {
    const value = fragment.current ?? (fragment.current = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    queueMicrotask(() => {
      if (/^[a-f0-9]{64}$/.test(value)) setToken(value);
      else if (value) setError("This reset link is incomplete or invalid. Request a new one.");
      setReadingLink(false);
    });
  }, []);

  const rules = [
    { label: "8+ characters", done: password.length >= 8 },
    { label: "Uppercase", done: /[A-Z]/.test(password) },
    { label: "Lowercase", done: /[a-z]/.test(password) },
    { label: "Number", done: /[0-9]/.test(password) },
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is missing. Request a new password reset email.");
      return;
    }
    if (password !== confirmation) {
      setError("Your passwords do not match.");
      return;
    }
    if (!rules.every((rule) => rule.done)) {
      setError("Use at least 8 characters with uppercase, lowercase and a number.");
      return;
    }

    setBusy(true);
    try {
      await resetAdminPassword(token, password);
      setToken("");
      setPassword("");
      setConfirmation("");
      setCompleted(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to reset your password. Please request a new link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="zb-recovery-shell zb-recovery-shell--reset" aria-labelledby="reset-password-title">
      <div className="zb-recovery-copy">
        <span className="zb-recovery-kicker">Secure reset</span>
        <h1 id="reset-password-title">Choose a new password.</h1>
        <p>Use a strong password that you do not reuse on another service.</p>
        <div className="zb-recovery-security-note">
          <ShieldCheck aria-hidden="true" />
          <span><strong>Single-use recovery</strong>Your reset link expires and is invalidated after use.</span>
        </div>
      </div>

      <div className="zb-recovery-card">
        {completed ? (
          <div className="zb-recovery-success" role="status">
            <span><CheckCircle2 aria-hidden="true" /></span>
            <h2>Password updated</h2>
            <p>Your administrator password has been changed. Sign in with the new password.</p>
            <Link className="zb-recovery-primary-link" href="/login">Continue to sign in</Link>
          </div>
        ) : readingLink ? (
          <p className="zb-recovery-reading" role="status">Checking your secure link…</p>
        ) : !token ? (
          <div className="zb-recovery-success zb-recovery-success--neutral">
            <span><KeyRound aria-hidden="true" /></span>
            <h2>Request a new link</h2>
            <p>This page needs the secure token from your recovery email.</p>
            <Link className="zb-recovery-primary-link" href="/forgot-password">Go to password recovery</Link>
            <Link href="/login"><ArrowLeft aria-hidden="true" />Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <PasswordInput label="New password" value={password} onChange={setPassword} />
            <ul className="zb-recovery-rules" aria-label="Password requirements">
              {rules.map((rule) => (
                <li key={rule.label} className={rule.done ? "is-done" : undefined}>
                  <Check aria-hidden="true" />{rule.label}
                </li>
              ))}
            </ul>
            <PasswordInput label="Confirm password" value={confirmation} onChange={setConfirmation} />
            {error && <p className="zb-recovery-error" role="alert">{error}</p>}
            <button className="zb-recovery-submit" type="submit" disabled={busy}>
              <ShieldCheck aria-hidden="true" />
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
