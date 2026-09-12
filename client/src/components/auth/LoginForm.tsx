"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LockKeyhole, LogIn, Mail, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import { login } from "@/services/auth.service";

function destinationForRole(role: "ADMIN" | "BUSINESS" | "WORKER" | "PLACEMENT_CELL") {
  if (role === "ADMIN") return "/admin";
  if (role === "BUSINESS") return "/business";
  if (role === "PLACEMENT_CELL") return "/placement-portal";
  return "/worker";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await login(email.trim(), password, mfaRequired ? mfaCode : undefined);
      const user = response.data.user;
      router.push(user.mustChangePassword ? "/business/change-password" : destinationForRole(user.role));
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "MFA_REQUIRED") {
        setMfaRequired(true);
        setMfaCode("");
        setError("Password verified. Enter your administrator authenticator or recovery code.");
      } else {
        setError(caught instanceof ApiError ? caught.message : "Unable to sign in. Check that the backend is running and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="zb-login-form" onSubmit={handleSubmit}>
      <div className="zb-login-form-heading">
        <span className="zb-icon-tile" aria-hidden="true">
          <LockKeyhole />
        </span>
        <div>
          <p className="zb-eyebrow">Secure account access</p>
          <h2>Sign in to ZOBHUNGER</h2>
        </div>
      </div>

      <label>
        <span>Email address</span>
        <span className="zb-auth-input-wrap">
          <Mail aria-hidden="true" />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            required
          />
        </span>
      </label>

      <label>
        <span>Password</span>
        <span className="zb-password-field zb-auth-input-wrap">
          <KeyRound aria-hidden="true" />
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />
          <button
            className="zb-password-toggle"
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </span>
      </label>

      <div className="zb-login-form-links"><Link href="/forgot-password">Forgot admin password?</Link></div>

      {mfaRequired && (
        <label>
          <span>Administrator verification code</span>
          <span className="zb-auth-input-wrap">
            <ShieldCheck aria-hidden="true" />
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value)}
              placeholder="6-digit code or recovery code"
              minLength={6}
              maxLength={32}
              required
              autoFocus
            />
          </span>
        </label>
      )}

      {error && (
        <p className="zb-login-error" role="alert">
          {error}
        </p>
      )}

      <button className="zb-login-submit" type="submit" disabled={submitting}>
        <LogIn aria-hidden="true" />
        {submitting ? "Signing in..." : "Sign in"}
      </button>

      <p className="zb-login-security-note">
        <ShieldCheck aria-hidden="true" />
        Protected sign-in using secure httpOnly session cookies.
      </p>
    </form>
  );
}
