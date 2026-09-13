"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { requestAdminPasswordReset } from "@/services/auth.service";
import { requestBusinessRecovery } from "@/services/business.service";
import { requestWorkerEmail } from "@/services/worker.service";

type AccountType = "BUSINESS" | "WORKER" | "ADMIN";

const accountTypes = [
  { id: "BUSINESS" as const, label: "Business", icon: Building2 },
  { id: "WORKER" as const, label: "Worker", icon: UserRound },
  { id: "ADMIN" as const, label: "Admin", icon: ShieldCheck },
];

export function UnifiedPasswordRecovery() {
  const [accountType, setAccountType] = useState<AccountType>("BUSINESS");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (accountType === "ADMIN") {
        await requestAdminPasswordReset(normalizedEmail);
      } else if (accountType === "WORKER") {
        await requestWorkerEmail("forgot-password", normalizedEmail, "/worker");
      } else {
        await requestBusinessRecovery(normalizedEmail);
      }
      setSent(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to request a password reset right now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="zb-recovery-shell" aria-labelledby="password-recovery-title">
      <div className="zb-recovery-copy">
        <span className="zb-recovery-kicker">Account recovery</span>
        <h1 id="password-recovery-title">Reset your password.</h1>
        <p>
          Choose the account you use to sign in, then enter its registered email address.
          We&apos;ll send a secure reset link if the account is eligible.
        </p>
        <div className="zb-recovery-security-note">
          <ShieldCheck aria-hidden="true" />
          <span>
            <strong>Private by design</strong>
            Recovery responses do not reveal whether an account exists.
          </span>
        </div>
      </div>

      <div className="zb-recovery-card">
        {sent ? (
          <div className="zb-recovery-success" role="status">
            <span><CheckCircle2 aria-hidden="true" /></span>
            <h2>Check your inbox</h2>
            <p>
              If an eligible {accountType.toLowerCase()} account uses <strong>{email.trim()}</strong>,
              a reset link will arrive shortly. Check your spam folder too.
            </p>
            <button type="button" onClick={() => setSent(false)}>Send another link</button>
            <Link href="/login"><ArrowLeft aria-hidden="true" />Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="zb-recovery-form-heading">
              <p>Choose account type</p>
              <div className="zb-recovery-account-switch" role="group" aria-label="Account type">
                {accountTypes.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={accountType === id ? "is-active" : undefined}
                    onClick={() => setAccountType(id)}
                    aria-pressed={accountType === id}
                  >
                    <Icon aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="zb-recovery-field">
              <span>Email address</span>
              <span className="zb-recovery-input-wrap">
                <Mail aria-hidden="true" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  maxLength={254}
                  required
                />
              </span>
            </label>

            {error && <p className="zb-recovery-error" role="alert">{error}</p>}

            <button className="zb-recovery-submit" type="submit" disabled={busy}>
              <Send aria-hidden="true" />
              {busy ? "Sending…" : "Send reset link"}
            </button>

            <Link className="zb-recovery-back" href="/login">
              <ArrowLeft aria-hidden="true" />Back to sign in
            </Link>
          </form>
        )}
      </div>
    </section>
  );
}
