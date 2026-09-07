"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import { ApiError } from "@/lib/api";
import { login } from "@/services/auth.service";

function destinationForRole(role: "ADMIN" | "BUSINESS" | "WORKER" | "PLACEMENT_CELL") {
  if (role === "ADMIN") return "/admin";
  if (role === "BUSINESS") return "/for-business";
  if (role === "PLACEMENT_CELL") return "/placement-portal";
  return "/for-workers";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await login(email.trim(), password);
      router.push(destinationForRole(response.data.user.role));
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to sign in. Check that the backend is running and try again.",
      );
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
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@zobhunger.com"
          required
        />
      </label>

      <label>
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
        />
      </label>

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
        Authentication uses the secure httpOnly cookie issued by the backend.
      </p>
    </form>
  );
}
